import * as AuthSession from 'expo-auth-session';

/**
 * Where Keycloak sends the browser back to, derived from the per-variant `scheme`:
 * `aeevente://auth` in production, `aeevente-dev://auth` in the dev build. Both must be
 * registered on the client, as redirect URIs *and* post-logout redirect URIs.
 *
 * Its own module because `KeycloakAuthService` and `app/+native-intent.ts` both need it.
 */
export const AUTH_REDIRECT_URI = AuthSession.makeRedirectUri({ path: 'auth' });

if (__DEV__) {
	// Keycloak matches this exactly, and a mismatch fails with no hint as to what it wanted.
	console.log(`[auth] Keycloak redirect URI: ${AUTH_REDIRECT_URI}`);
}
