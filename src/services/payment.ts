import type { PaymentService } from './PaymentService';
import { SumUpPaymentService } from './SumUpPaymentService';

/** Composition root for payments — swap to a mock here to work without a reader. */
export const paymentService: PaymentService = new SumUpPaymentService();
