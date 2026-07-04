import type {
	PaymentMethod,
	PaymentResult,
	TapToPayAvailability,
} from '@/modules/sumup-tap-to-pay-sdk-react-native';

export type { PaymentMethod, PaymentResult, TapToPayAvailability };

/**
 * How a sale is settled in the app: the SumUp card methods ({@link PaymentMethod}) plus
 * **cash** ('espèces'). A cash sale takes no card, so it never touches this service — it is
 * just recorded locally (see `useCheckout`). The card {@link PaymentService} below only ever
 * deals in `PaymentMethod`; `CheckoutMethod` is the wider set the UI and history speak in.
 */
export type CheckoutMethod = PaymentMethod | 'cash';

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
	/**
	 * Enable Tap to Pay on iPhone outside of a sale (Apple activation / T&C sheet).
	 * iOS only; resolves the availability + activation state.
	 */
	activateTapToPay(): Promise<TapToPayAvailability>;
	/**
	 * Present Apple's built-in Tap to Pay merchant education (iOS 18+). iOS only;
	 * rejects where it isn't available so the caller can show a fallback.
	 */
	presentTapToPayEducation(): Promise<void>;
}
