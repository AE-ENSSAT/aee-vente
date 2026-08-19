import Constants from 'expo-constants';

/**
 * AEE Manager API + Keycloak coordinates, surfaced from `app.config.js` `extra`
 * (sourced from .env) — the same pattern as {@link constants/sumup.ts}.
 *
 * The API itself has no login endpoint: it only validates Keycloak-issued JWTs, so the
 * app needs both the API base URL and the realm that signs the tokens.
 */
const extra = (Constants.expoConfig?.extra ?? {}) as {
	apiBaseUrl?: string;
	keycloakUrl?: string;
	keycloakRealm?: string;
	keycloakClientId?: string;
};

/** Strip a trailing slash so `${BASE}/path` never doubles up. */
const trimSlash = (url: string): string => url.replace(/\/+$/, '');

/** Base URL of the AEE Manager API, e.g. `https://api.aee-manager.bde-enssat.fr`. */
export const API_BASE_URL = trimSlash(extra.apiBaseUrl ?? '');

/** Keycloak server root, e.g. `https://auth.aee-manager.bde-enssat.fr`. */
export const KEYCLOAK_URL = trimSlash(extra.keycloakUrl ?? '');

/** Keycloak realm holding the app's users. */
export const KEYCLOAK_REALM = extra.keycloakRealm ?? '';

/** Public Keycloak client the app authenticates as. */
export const KEYCLOAK_CLIENT_ID = extra.keycloakClientId ?? '';

/** OpenID Connect endpoints of {@link KEYCLOAK_REALM}. */
export const KEYCLOAK_ENDPOINTS = {
	/** Where the SSO browser round-trip starts (authorization code + PKCE). */
	authorize: `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/auth`,
	token: `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/token`,
	/** RP-initiated logout — also ends the SSO session in the browser, not just our tokens. */
	logout: `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/logout`,
	userInfo: `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/userinfo`,
};
