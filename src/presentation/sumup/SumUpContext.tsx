import {
	createContext,
	type ReactNode,
	useContext,
	useEffect,
	useMemo,
	useState,
} from 'react';
import type {
	PaymentMethod,
	PaymentResult,
} from '@/src/services/PaymentService';
import { paymentService } from '@/src/services/payment';

interface SumUpContextValue {
	/** True once the initial login attempt has settled (payments re-verify anyway). */
	ready: boolean;
	pay: (method: PaymentMethod, amountCents: number) => Promise<PaymentResult>;
	openReaderSettings: () => Promise<void>;
}

const SumUpContext = createContext<SumUpContextValue | null>(null);

/**
 * Owns the SumUp session: logs in once when the app mounts (so payments are ready)
 * and exposes the payment actions. Wraps {@link paymentService}; holds no SumUp logic.
 */
export function SumUpProvider({ children }: { children: ReactNode }) {
	const [ready, setReady] = useState(false);

	useEffect(() => {
		let active = true;
		paymentService
			.prepare()
			.catch(() => undefined) // a failed pre-login is retried on first pay()
			.finally(() => {
				if (active) {
					setReady(true);
				}
			});
		return () => {
			active = false;
		};
	}, []);

	const value = useMemo<SumUpContextValue>(
		() => ({
			ready,
			pay: (method, amountCents) =>
				paymentService.pay(method, amountCents),
			openReaderSettings: () => paymentService.openReaderSettings(),
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
