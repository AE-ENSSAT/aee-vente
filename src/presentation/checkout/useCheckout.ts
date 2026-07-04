import { useCallback, useState } from 'react';
import { transactionStore } from '@/src/data/transactionStore';
import { linePrice, useBasket } from '@/src/presentation/basket/BasketContext';
import {
	isTapToPayIosTooOld,
	TAP_TO_PAY_UPDATE_IOS_MESSAGE,
} from '@/src/presentation/checkout/tapToPaySupport';
import { hapticError } from '@/src/presentation/haptics';
import { useSumUp } from '@/src/presentation/sumup/SumUpContext';
import type { PaymentMethod } from '@/src/services/PaymentService';

/**
 * Application use-case: pay the current basket total with a method. Keeps payment
 * orchestration out of the view components. `onSuccess` fires on a successful payment — it
 * owns the celebration, clears + closes the basket behind it (deferred until the flourish is
 * covering, so it's never seen). Its argument is the recorded sale's id so the screen can
 * offer a receipt, or `null` when the sale could not be persisted locally (celebrate anyway,
 * but there is no stored transaction to open). Declined attempts are also recorded (so a
 * confidential receipt stays reachable from the history — Apple Tap to Pay req 5.10).
 */
export function useCheckout(
	onSuccess?: (transactionId: string | null) => void,
) {
	const { totalCents, items } = useBasket();
	const { pay } = useSumUp();
	const [busy, setBusy] = useState(false);
	// Only failures surface in the UI (success is celebrated via onSuccess).
	const [error, setError] = useState<string | null>(null);

	const checkout = useCallback(
		async (method: PaymentMethod) => {
			if (totalCents <= 0) {
				return;
			}
			setBusy(true);
			setError(null);
			// Req 1.4: on an iPhone too old for Tap to Pay, tell the merchant to update
			// iOS instead of surfacing a generic failure. Applied only when a Tap to Pay
			// attempt on such a device fails, so newer iPhones and the Bluetooth reader
			// are never affected.
			const tooOldForTapToPay =
				method === 'tapToPay' && isTapToPayIosTooOld();
			// Snapshot the basket into the local store (survives restarts, cleared on
			// sign-out). Records approved sales AND declined attempts, so a confidential
			// receipt can still be offered for a decline — Apple Tap to Pay req 5.10.
			// Best-effort: a storage failure must never break the payment flow.
			const persist = async (
				id: string,
				status: 'approved' | 'declined',
			): Promise<boolean> => {
				try {
					await transactionStore.add({
						id,
						amountCents: totalCents,
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
			try {
				const result = await pay(method, totalCents);
				if (result.success) {
					// SumUp's own code when present, else the (always-set) client id —
					// the same id the sale is stored under, so the success handler can
					// open its receipt.
					const transactionId =
						result.sumupTransactionId ?? result.transactionId;
					const stored = await persist(transactionId, 'approved');
					onSuccess?.(stored ? transactionId : null);
				} else {
					// A card read that completed but was refused: record it as a declined
					// transaction (its receipt is then reachable from the history), then
					// surface the refusal.
					await persist(result.transactionId, 'declined');
					hapticError();
					setError(
						tooOldForTapToPay
							? TAP_TO_PAY_UPDATE_IOS_MESSAGE
							: 'Paiement refusé',
					);
				}
			} catch (e) {
				hapticError();
				setError(
					tooOldForTapToPay
						? TAP_TO_PAY_UPDATE_IOS_MESSAGE
						: e instanceof Error
							? e.message
							: String(e),
				);
			} finally {
				setBusy(false);
			}
		},
		[totalCents, items, pay, onSuccess],
	);

	const dismissError = useCallback(() => setError(null), []);

	return { checkout, busy, error, dismissError };
}
