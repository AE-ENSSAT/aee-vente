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
 * but there is no stored transaction to open).
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
			try {
				const result = await pay(method, totalCents);
				if (result.success) {
					// SumUp's own code when present, else the (always-set) client id —
					// the same id the sale is stored under, so the success handler can
					// open its receipt.
					const transactionId =
						result.sumupTransactionId ?? result.transactionId;
					// Persist the completed sale locally (survives app restarts,
					// cleared on sign-out). A storage failure must not break the
					// success flow, so it is caught and ignored — but a receipt is
					// then not offered (there'd be nothing to open).
					let stored = false;
					try {
						await transactionStore.add({
							id: transactionId,
							amountCents: totalCents,
							method,
							lines: items.map((item) => ({
								productName: item.product.name,
								variantName: item.variant?.name ?? null,
								quantity: item.quantity,
								unitCents: linePrice(item),
							})),
						});
						stored = true;
					} catch {
						// ignore — the payment still succeeded
					}
					onSuccess?.(stored ? transactionId : null);
				} else {
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
