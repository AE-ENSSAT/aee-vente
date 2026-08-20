import Constants from 'expo-constants';

/**
 * API + Keycloak coordinates, from `app.config.js` `extra`. The API has no login endpoint
 * of its own — it only validates the realm's JWTs — so both are needed.
 */
const extra = (Constants.expoConfig?.extra ?? {}) as {
	apiBaseUrl?: string;
	keycloakUrl?: string;
	keycloakRealm?: string;
	keycloakClientId?: string;
};

/** Strip a trailing slash so `${BASE}/path` never doubles up. */
const trimSlash = (url: string): string => url.replace(/\/+$/, '');

export const API_BASE_URL = trimSlash(extra.apiBaseUrl ?? '');

export const KEYCLOAK_URL = trimSlash(extra.keycloakUrl ?? '');

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
