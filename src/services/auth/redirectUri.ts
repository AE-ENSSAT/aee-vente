import * as AuthSession from 'expo-auth-session';

/**
 * Where Keycloak sends the browser back to. Derived from the app's `scheme` (`aeevente`),
 * so it resolves to **`aeevente://auth`** — that exact string has to be registered on the
 * Keycloak client as a *Valid redirect URI*, and as a *Valid post logout redirect URI* for
 * the sign-out round-trip.
 *
 * It sits in its own module because two unrelated places need it: `KeycloakAuthService`,
 * which starts the round-trip, and `app/+native-intent.ts`, which keeps the callback deep
 * link away from expo-router on Android (see there).
 */
export const AUTH_REDIRECT_URI = AuthSession.makeRedirectUri({ path: 'auth' });

if (__DEV__) {
	// Printed because Keycloak matches this string exactly: a mismatch fails the round-trip
	// with `invalid_redirect_uri` and no hint as to what it expected. Copy it from the Metro
	// logs into the client's redirect-URI lists rather than typing it from memory.
	console.log(`[auth] Keycloak redirect URI: ${AUTH_REDIRECT_URI}`);
}
