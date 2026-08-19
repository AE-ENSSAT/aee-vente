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
 * The rails this tenant has enabled, so a cash-only association shows no card buttons.
 *
 * **Fails open**: while loading, or if the call fails, every method is offered — a bar POS
 * must keep taking money, and an order on a disabled rail is refused server-side anyway.
 */
export function usePaymentMethods(): CheckoutMethod[] {
	const { tenant } = useAuth();
	const tenantId = tenant?.tenantId ?? null;
	const [methods, setMethods] = useState<CheckoutMethod[]>(ALL_METHODS);

	// Keyed on the tenant: a switch must not leave the previous association's buttons on the
	// sheet. `paymentConfigService` caches per tenant, so this shares the SumUp session's fetch.
	// biome-ignore lint/correctness/useExhaustiveDependencies: deliberate refetch key
	useEffect(() => {
		let active = true;
		paymentConfigService
			.enabledMethods()
			.then((enabled) => {
				// An empty list means nothing is configured yet — keep the defaults.
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
