import Constants from 'expo-constants';

/**
 * The login **access token** is deliberately absent: it is the association's own merchant
 * key, served per tenant by the API. Bundling one would leak a secret and pay every
 * association's takings into a single SumUp account.
 */
const extra = (Constants.expoConfig?.extra ?? {}) as {
	sumupAffiliateKey?: string;
};

/** Affiliate key (`sup_afk_...`) — identifies the app, not the merchant. */
export const SUMUP_AFFILIATE_KEY = extra.sumupAffiliateKey ?? '';
