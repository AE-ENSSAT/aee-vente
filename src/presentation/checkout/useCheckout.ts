import { useCallback, useState } from 'react';
import { ApiError } from '@/src/api';
import { transactionStore } from '@/src/data/transactionStore';
import { linePrice, useBasket } from '@/src/presentation/basket/BasketContext';
import {
	isTapToPayIosTooOld,
	TAP_TO_PAY_UPDATE_IOS_MESSAGE,
} from '@/src/presentation/checkout/tapToPaySupport';
import { hapticError } from '@/src/presentation/haptics';
import { useSumUp } from '@/src/presentation/sumup/SumUpContext';
import { orderService } from '@/src/services/orders';
import type { CheckoutMethod } from '@/src/services/PaymentService';

/**
 * A fresh key per attempt: a refused card order is already cancelled server-side, and the
 * API expects the retry under a new one.
 */
function newIdempotencyKey(): string {
	return `pos-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e9).toString(36)}`;
}

/**
 * Use-case: sell the current basket.
 *
 * The sale is opened on the server *before* any money is taken, which is what makes the two
 * sides reconcilable: `POST /orders` (cash comes back `completed`, a card mean `pending`),
 * then the card is charged for the **server's** total — the backend prices the cart — and
 * the outcome reported with `/confirm` (carrying SumUp's transaction id) or `/decline`.
 *
 * Attempts are mirrored into {@link transactionStore}, which holds the product names the
 * API's sale items don't carry — declined ones too, so a receipt stays reachable for them
 * (Apple req 5.10). `onSuccess` gets the id to open a receipt for, or null when nothing
 * could be stored locally: celebrate anyway, the money was taken.
 */
export function useCheckout(
	onSuccess?: (transactionId: string | null) => void,
) {
	const { totalCents, items } = useBasket();
	const { pay } = useSumUp();
	// Which method is charging, so the UI can spin only the pressed button — the others must
	// not look disabled (Apple Tap to Pay req 5.3).
	const [pendingMethod, setPendingMethod] = useState<CheckoutMethod | null>(
		null,
	);
	const [error, setError] = useState<string | null>(null);

	const checkout = useCallback(
		async (method: CheckoutMethod) => {
			if (totalCents <= 0) {
				return;
			}
			setPendingMethod(method);
			setError(null);

			// Snapshot locally for the receipt's product names. Best-effort: never fail a payment.
			const persist = async (
				id: string,
				amountCents: number,
				status: 'approved' | 'declined',
			): Promise<boolean> => {
				try {
					await transactionStore.add({
						id,
						amountCents,
						method,
						status,
						lines: items.map((item) => ({
							productName: item.product.name,
							variantName: item.variant?.name ?? null,
							quantity: item.quantity,
							unitCents: linePrice(item),
						})),
					});
					return true;
				} catch {
					return false;
				}
			};

			// Req 1.4: on an iPhone too old for Tap to Pay, say "update iOS" rather than
			// surface a generic failure. Only for a failed Tap to Pay attempt on such a device.
			const tooOldForTapToPay =
				method === 'tapToPay' && isTapToPayIosTooOld();
			const fail = (message: string) => {
				hapticError();
				setError(
					tooOldForTapToPay ? TAP_TO_PAY_UPDATE_IOS_MESSAGE : message,
				);
			};

			try {
				// 1. Open the sale. Cash is settled by this call alone.
				const order = await orderService.createOrder(items, method, {
					idempotencyKey: newIdempotencyKey(),
				});

				if (method === 'cash') {
					const stored = await persist(
						order.id,
						order.totalCents,
						'approved',
					);
					onSuccess?.(stored ? order.id : null);
					return;
				}

				// 2. Charge the card for what the server priced.
				const result = await pay(method, order.totalCents);

				if (!result.success) {
					// Refused: cancel the pending order rather than leave it to expire.
					await orderService
						.declineOrder(order.id)
						.catch(() => undefined);
					await persist(order.id, order.totalCents, 'declined');
					fail('Paiement refusé');
					return;
				}

				// 3. Accepted — settle it against SumUp's own transaction id.
				const sumupTxId =
					result.sumupTransactionId ?? result.transactionId;
				try {
					await orderService.confirmOrder(order.id, sumupTxId);
				} catch {
					// The card was charged but the confirmation didn't land (network drop,
					// app backgrounded). The customer has paid, so the sale succeeds here
					// and the order stays pending server-side until `POST /orders/reconcile`
					// matches it against SumUp — which is what that endpoint exists for.
					orderService.reconcile().catch(() => undefined);
				}
				const stored = await persist(
					order.id,
					order.totalCents,
					'approved',
				);
				onSuccess?.(stored ? order.id : null);
			} catch (e) {
				// Raised before the card was charged: the order couldn't be opened, or the
				// SDK threw. Nothing was taken, so there is nothing to reconcile.
				fail(
					e instanceof ApiError || e instanceof Error
						? e.message
						: String(e),
				);
			} finally {
				setPendingMethod(null);
			}
		},
		[totalCents, items, pay, onSuccess],
	);

	const dismissError = useCallback(() => setError(null), []);

	return {
		checkout,
		/** A payment is in flight (any method). */
		busy: pendingMethod !== null,
		/** Which method is being charged, or null — so only its button spins. */
		pendingMethod,
		error,
		dismissError,
	};
}
