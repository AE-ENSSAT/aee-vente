import type {
	PaymentMethod,
	PaymentResult,
	TapToPayAvailability,
} from '@/modules/sumup-tap-to-pay-sdk-react-native';

export type { PaymentMethod, PaymentResult, TapToPayAvailability };

/** Card methods plus cash. A cash sale takes no card, so it never reaches this service. */
export type CheckoutMethod = PaymentMethod | 'cash';

/** Taking a card payment. Screens depend on this, not on the SumUp module. */
export interface PaymentService {
	/** Log in with the tenant's own SumUp key. Idempotent per token; a new one switches account. */
	prepare(accessToken: string): Promise<void>;
	pay(method: PaymentMethod, amountCents: number): Promise<PaymentResult>;
	openReaderSettings(): Promise<void>;
	/** iOS only: Apple's activation / T&C sheet, outside a sale. */
	activateTapToPay(): Promise<TapToPayAvailability>;
	/** iOS 18+ merchant education; rejects where unavailable so the caller can fall back. */
	presentTapToPayEducation(): Promise<void>;
}
