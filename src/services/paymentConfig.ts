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
 * The association's own merchant account: both card rails carry the same key, and null
 * (cash only) is not an error.
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
 * Which rails this tenant takes and the SumUp key its devices log in with. Configured per
 * association in the back-office, so a cash-only one never shows a card button.
 */
export const paymentConfigService = {
	/**
	 * The tenant's rails; disabled ones come back flagged `enabled: false`. Cached per
	 * tenant because two callers want it on every switch — the payment sheet and the SumUp
	 * session — and a failed request is not kept.
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
