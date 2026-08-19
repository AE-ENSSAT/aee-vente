import Constants from 'expo-constants';

/**
 * SumUp's affiliate key, surfaced from `app.config.js` `extra` (sourced from .env).
 *
 * The login **access token** is deliberately not here: it is the association's own
 * merchant key and comes from the API per tenant (`GET /payment-method-config` →
 * `paymentConfigService`). Shipping one in the bundle would both leak a secret and pay
 * every association's takings into a single SumUp account.
 */
const extra = (Constants.expoConfig?.extra ?? {}) as {
	sumupAffiliateKey?: string;
};

/** Affiliate key (`sup_afk_...`) — identifies the app, not the merchant. */
export const SUMUP_AFFILIATE_KEY = extra.sumupAffiliateKey ?? '';
