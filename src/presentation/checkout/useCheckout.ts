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
 * A fresh key for one checkout attempt, so a retried request can't bill twice. Each
 * attempt gets its own: a refused card order is already cancelled server-side, and the
 * API expects the retry to arrive under a new key.
 */
function newIdempotencyKey(): string {
	return `pos-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e9).toString(36)}`;
}

/**
 * Application use-case: sell the current basket.
 *
 * The sale is opened on the server *before* any money is taken, which is what makes the
 * two sides reconcilable:
 *
 * 1. `POST /orders` — cash comes back `completed`; a card mean comes back `pending`;
 * 2. the device charges the card (SumUp);
 * 3. `POST /orders/{id}/confirm` with SumUp's transaction id, or `/decline` when refused.
 *
 * The card is charged the **server's** total, not the basket's: the backend prices the
 * cart itself (member rates, option deltas, catalogue edits since the grid was loaded),
 * and what is charged must be what gets recorded.
 *
 * Each attempt is also mirrored into the local {@link transactionStore}, which holds the
 * product names the API's sale items don't carry — that is what the receipt and the
 * history screen read. Declined attempts are stored too, so a confidential receipt stays
 * reachable for them (Apple Tap to Pay req 5.10).
 *
 * `onSuccess` fires on a successful sale with the id to open a receipt for, or `null` when
 * nothing could be stored locally (celebrate anyway — the money was taken).
 */
export function useCheckout(
	onSuccess?: (transactionId: string | null) => void,
) {
	const { totalCents, items } = useBasket();
	const { pay } = useSumUp();
	// The method currently being charged, or null when idle. Tracked (rather than a bare
	// boolean) so the UI can spin only the button that was pressed — the others must not look
	// disabled (Apple Tap to Pay req 5.3). `busy` is derived from it.
	const [pendingMethod, setPendingMethod] = useState<CheckoutMethod | null>(
		null,
	);
	// Only failures surface in the UI (success is celebrated via onSuccess).
	const [error, setError] = useState<string | null>(null);

	const checkout = useCallback(
		async (method: CheckoutMethod) => {
			if (totalCents <= 0) {
				return;
			}
			setPendingMethod(method);
			setError(null);

			// Snapshot the sale locally under the server's id, so the receipt can show the
			// product names. Best-effort: a storage failure must never break the payment.
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

			// Req 1.4: on an iPhone too old for Tap to Pay, tell the merchant to update
			// iOS instead of surfacing a generic failure. Applied only when a Tap to Pay
			// attempt on such a device fails, so newer iPhones and the Bluetooth reader
			// are never affected.
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
					// Refused: cancel the pending order rather than let it sit until it
					// expires. Its own failure isn't worth reporting over the refusal.
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
