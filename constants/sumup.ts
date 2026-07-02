import Constants from 'expo-constants';

/**
 * SumUp keys, surfaced from `app.config.js` `extra` (sourced from .env).
 * Replace with a backend-issued token in production.
 */
const extra = (Constants.expoConfig?.extra ?? {}) as {
	sumupAffiliateKey?: string;
	sumupAccessToken?: string;
};

/** Affiliate key (`sup_afk_...`). */
export const SUMUP_AFFILIATE_KEY = extra.sumupAffiliateKey ?? '';

/** Secret API key used as the login access token (`sup_sk_...`). */
export const SUMUP_ACCESS_TOKEN = extra.sumupAccessToken ?? '';
