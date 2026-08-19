import {
	createContext,
	type ReactNode,
	useContext,
	useEffect,
	useMemo,
	useState,
} from 'react';
import { useAuth } from '@/src/presentation/auth/AuthContext';
import type {
	PaymentMethod,
	PaymentResult,
	TapToPayAvailability,
} from '@/src/services/PaymentService';
import { paymentService } from '@/src/services/payment';
import {
	paymentConfigService,
	sumupApiKeyOf,
} from '@/src/services/paymentConfig';

interface SumUpContextValue {
	/** True once the initial login attempt has settled (payments re-verify anyway). */
	ready: boolean;
	pay: (method: PaymentMethod, amountCents: number) => Promise<PaymentResult>;
	openReaderSettings: () => Promise<void>;
	/** Enable Tap to Pay outside a sale (Apple activation / T&C sheet). iOS only. */
	activateTapToPay: () => Promise<TapToPayAvailability>;
	/** Present Apple's Tap to Pay merchant education (iOS 18+). iOS only. */
	presentTapToPayEducation: () => Promise<void>;
}

const SumUpContext = createContext<SumUpContextValue | null>(null);

/**
 * Owns the SumUp session: logs in once an association is selected, and exposes the payment
 * actions. Keyed on the tenant, because the merchant account is the tenant's — switching
 * association logs the device into the other account.
 */
export function SumUpProvider({ children }: { children: ReactNode }) {
	const { tenant } = useAuth();
	const tenantId = tenant?.tenantId ?? null;
	const [ready, setReady] = useState(false);

	useEffect(() => {
		setReady(false);
		if (!tenantId) {
			return;
		}
		let active = true;
		paymentConfigService
			.list()
			.then((config) => {
				const key = sumupApiKeyOf(config);
				// A cash-only association has no SumUp account, and no card rail to offer.
				return key ? paymentService.prepare(key) : undefined;
			})
			.catch(() => undefined) // a failed pre-login is retried on first pay()
			.finally(() => {
				if (active) {
					setReady(true);
				}
			});
		return () => {
			active = false;
		};
	}, [tenantId]);

	const value = useMemo<SumUpContextValue>(
		() => ({
			ready,
			pay: (method, amountCents) =>
				paymentService.pay(method, amountCents),
			openReaderSettings: () => paymentService.openReaderSettings(),
			activateTapToPay: () => paymentService.activateTapToPay(),
			presentTapToPayEducation: () =>
				paymentService.presentTapToPayEducation(),
		}),
		[ready],
	);

	return (
		<SumUpContext.Provider value={value}>{children}</SumUpContext.Provider>
	);
}

export function useSumUp(): SumUpContextValue {
	const ctx = useContext(SumUpContext);
	if (!ctx) {
		throw new Error('useSumUp must be used within a SumUpProvider');
	}
	return ctx;
}
