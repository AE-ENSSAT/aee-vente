import type { PaymentService } from './PaymentService';
import { SumUpPaymentService } from './SumUpPaymentService';

/**
 * Composition root for payments — the single binding of the {@link PaymentService}
 * interface to its implementation. Swap to a mock here for tests/dev without a reader.
 */
export const paymentService: PaymentService = new SumUpPaymentService();
