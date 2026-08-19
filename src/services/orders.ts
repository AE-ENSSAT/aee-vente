import {
	ApiError,
	api,
	type CreateOrderDto,
	type PaginatedSalesDto,
	type SaleResponseDto,
} from '@/src/api';
import type { BasketItem } from '@/src/domain/models';
import type { CheckoutMethod } from './PaymentService';

/** The rails the backend settles a sale on. */
export type PaymentMean = CreateOrderDto['paymentMean'];

/** Bridge the app's checkout vocabulary to the backend's `paymentMean` enum. */
const PAYMENT_MEANS: Record<CheckoutMethod, PaymentMean> = {
	cash: 'CASH',
	tapToPay: 'TAP_TO_PAY',
	bluetoothCardReader: 'CARD_READER',
};

export const paymentMeanOf = (method: CheckoutMethod): PaymentMean =>
	PAYMENT_MEANS[method];

/**
 * Basket lines → the cart the API expects.
 *
 * The catalogue is two levels deep: a product either has its own price or exists only as a
 * group of variants, and each variant is itself a product server-side — so a chosen
 * variant's id goes in `variantId` while the group stays in `productId`.
 *
 * The return type is the spec's non-empty list, so an empty basket is ruled out here.
 */
function toCartItems(items: BasketItem[]): CreateOrderDto['items'] {
	const [first, ...rest] = items.map((item) => ({
		productId: item.product.id,
		...(item.variant ? { variantId: item.variant.id } : {}),
		qty: item.quantity,
	}));
	if (!first) {
		throw new ApiError('Le panier est vide.', null);
	}
	return [first, ...rest];
}

/**
 * The sale lifecycle as the backend models it: **cash** completes in {@link createOrder};
 * **card** opens a `pending` sale there, then reports the outcome with {@link confirmOrder}
 * (carrying SumUp's transaction id) or {@link declineOrder}.
 *
 * Creating the order *before* charging is what makes the two sides reconcilable: a payment
 * can never be taken without a sale on record to attach it to.
 */
export const orderService = {
	/**
	 * Open (or, for cash, complete) a sale for the current basket. `idempotencyKey` stops a
	 * retry billing twice; a *refused* card order must be retried under a NEW key, its first
	 * order having been cancelled.
	 */
	async createOrder(
		items: BasketItem[],
		method: CheckoutMethod,
		options: { memberId?: string; idempotencyKey?: string } = {},
	): Promise<SaleResponseDto> {
		const body: CreateOrderDto = {
			items: toCartItems(items),
			paymentMean: paymentMeanOf(method),
			...(options.memberId ? { memberId: options.memberId } : {}),
			...(options.idempotencyKey
				? { idempotencyKey: options.idempotencyKey }
				: {}),
		};
		const { data } = await api.createOrder(null, body);
		return data;
	},

	/** Card accepted: settle the pending sale against SumUp's transaction id. */
	async confirmOrder(
		orderId: string,
		sumupTxId: string,
	): Promise<SaleResponseDto> {
		const { data } = await api.confirmOrder({ id: orderId }, { sumupTxId });
		return data;
	},

	/** Card refused (or abandoned): cancel the pending sale so it can't linger. */
	async declineOrder(orderId: string): Promise<SaleResponseDto> {
		const { data } = await api.declineOrder({ id: orderId });
		return data;
	},

	/**
	 * Settle pending card orders against SumUp — recovers sales that were charged but whose
	 * confirmation never made it back (app killed, network lost).
	 */
	async reconcile(): Promise<void> {
		await api.reconcileOrders();
	},

	/** The signed-in seller's own sales, newest first, all statuses. */
	async mySales(): Promise<SaleResponseDto[]> {
		const { data } = await api.mySales();
		return data;
	},

	/** One sale with its line items. */
	async getSale(id: string): Promise<SaleResponseDto> {
		const { data } = await api.getSale({ id });
		return data;
	},

	/** Tenant-wide sales, paginated and filterable (back-office / reporting views). */
	async listSales(
		query: {
			from?: string;
			to?: string;
			method?: 'cash' | 'card';
			status?: 'pending' | 'completed' | 'cancelled';
			page?: number;
			pageSize?: number;
		} = {},
	): Promise<PaginatedSalesDto> {
		const { data } = await api.listSales(query);
		return data;
	},
};
