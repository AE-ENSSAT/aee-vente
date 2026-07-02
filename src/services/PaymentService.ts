import type {
	PaymentMethod,
	PaymentResult,
} from '@/modules/sumup-tap-to-pay-sdk-react-native';

export type { PaymentMethod, PaymentResult };

/**
 * Abstraction over taking a payment. The UI depends on this interface, not on the
 * SumUp module directly, so the payment backend can be mocked or replaced.
 */
export interface PaymentService {
	/** Make the payment methods ready (log in). Idempotent; safe to call repeatedly. */
	prepare(): Promise<void>;
	/** Charge `amountCents` (integer minor units) with `method`. Resolves a result map. */
	pay(method: PaymentMethod, amountCents: number): Promise<PaymentResult>;
	/** Open SumUp's card-reader settings / pairing screen. */
	openReaderSettings(): Promise<void>;
}
