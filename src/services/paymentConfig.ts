import { api, apiSession, type PaymentMethodConfigDto } from '@/src/api';
import type { PaymentMean } from './orders';
import type { CheckoutMethod } from './PaymentService';

/** The reverse of `orders.ts`' mapping: backend rail → the app's checkout vocabulary. */
const CHECKOUT_METHODS: Record<PaymentMean, CheckoutMethod> = {
	CASH: 'cash',
	TAP_TO_PAY: 'tapToPay',
	CARD_READER: 'bluetoothCardReader',
};

export const checkoutMethodOf = (mean: PaymentMean): CheckoutMethod =>
	CHECKOUT_METHODS[mean];

/**
 * The SumUp key the *device* should log in with — the association's own merchant account.
 * Both card rails (`TAP_TO_PAY`, `CARD_READER`) carry the same one; null when this tenant
 * runs no SumUp rail at all (cash only), which is not an error.
 */
export const sumupApiKeyOf = (
	config: PaymentMethodConfigDto[],
): string | null =>
	config.find((rail) => rail.provider === 'SUMUP' && rail.apiKey)?.apiKey ??
	null;

/** The tenant this config was fetched for, and the request that fetched it. */
let cached: {
	tenantId: string | null;
	request: Promise<PaymentMethodConfigDto[]>;
} | null = null;

/**
 * Which payment rails this tenant has turned on, and the SumUp key its devices should use.
 *
 * Configured per association in the back-office, so an association that only takes cash
 * never shows a card button — and the POS doesn't have to guess.
 */
export const paymentConfigService = {
	/**
	 * The tenant's rails. Disabled ones are returned too, flagged `enabled: false`.
	 *
	 * Cached per tenant: two unrelated callers want this document on every switch — the
	 * payment sheet (which rails to show) and the SumUp session (which merchant to log in
	 * as) — and they should not each cost a round-trip. A failed request is not kept.
	 */
	list(): Promise<PaymentMethodConfigDto[]> {
		const tenantId = apiSession.getTenantId();
		if (cached?.tenantId === tenantId) {
			return cached.request;
		}
		const request = api
			.list()
			.then(({ data }) => data)
			.catch((error) => {
				if (cached?.request === request) {
					cached = null; // let the next caller retry
				}
				throw error;
			});
		cached = { tenantId, request };
		return request;
	},

	/** Just the methods that may be used at the POS right now. */
	async enabledMethods(): Promise<CheckoutMethod[]> {
		const config = await paymentConfigService.list();
		return config
			.filter((rail) => rail.enabled)
			.map((rail) => checkoutMethodOf(rail.paymentMean));
	},
};
