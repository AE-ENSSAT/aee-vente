import { useEffect, useState } from 'react';
import { useAuth } from '@/src/presentation/auth/AuthContext';
import type { CheckoutMethod } from '@/src/services/PaymentService';
import { paymentConfigService } from '@/src/services/paymentConfig';

/** Every method the app can offer, used as the fail-open default (see below). */
const ALL_METHODS: CheckoutMethod[] = [
	'tapToPay',
	'bluetoothCardReader',
	'cash',
];

/**
 * The payment rails the current tenant has enabled (`GET /payment-method-config`), so an
 * association that only takes cash doesn't show card buttons.
 *
 * **Fails open**: while loading, or if the call fails, every method is offered. A POS at a
 * bar must keep taking money through a config hiccup — and an order on a disabled rail is
 * refused server-side anyway, which is a far better outcome than a screen with no way to pay.
 */
export function usePaymentMethods(): CheckoutMethod[] {
	const { tenant } = useAuth();
	const tenantId = tenant?.tenantId ?? null;
	const [methods, setMethods] = useState<CheckoutMethod[]>(ALL_METHODS);

	// Keyed on the tenant: rails are configured per association, so a switch must not leave
	// the previous one's buttons on the payment sheet. (`paymentConfigService` caches the
	// document per tenant, so this shares the fetch the SumUp session already makes.)
	// biome-ignore lint/correctness/useExhaustiveDependencies: deliberate refetch key
	useEffect(() => {
		let active = true;
		paymentConfigService
			.enabledMethods()
			.then((enabled) => {
				// An empty list means nothing is configured yet — keep the defaults rather
				// than presenting a dead payment page.
				if (active && enabled.length) {
					setMethods(enabled);
				}
			})
			.catch(() => undefined);
		return () => {
			active = false;
		};
	}, [tenantId]);

	return methods;
}
