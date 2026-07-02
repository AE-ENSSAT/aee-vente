import { useCallback, useState } from 'react';
import { useBasket } from '@/src/presentation/basket/BasketContext';
import { hapticError } from '@/src/presentation/haptics';
import { useSumUp } from '@/src/presentation/sumup/SumUpContext';
import type { PaymentMethod } from '@/src/services/PaymentService';

/**
 * Application use-case: pay the current basket total with a method. Keeps payment
 * orchestration out of the view components. `onSuccess` fires on a successful payment so
 * the screen can react — it owns the celebration and clears + closes the basket behind it
 * (clearing is deferred until the flourish is covering, so it's never seen).
 */
export function useCheckout(onSuccess?: () => void) {
	const { totalCents } = useBasket();
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
			try {
				const result = await pay(method, totalCents);
				if (result.success) {
					onSuccess?.();
				} else {
					hapticError();
					setError('Paiement refusé');
				}
			} catch (e) {
				hapticError();
				setError(e instanceof Error ? e.message : String(e));
			} finally {
				setBusy(false);
			}
		},
		[totalCents, pay, onSuccess],
	);

	const dismissError = useCallback(() => setError(null), []);

	return { checkout, busy, error, dismissError };
}
