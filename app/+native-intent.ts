import type { NativeIntent } from 'expo-router';
import { AUTH_REDIRECT_URI } from '@/src/services/auth/redirectUri';

/**
 * Keeps the SSO callback out of the router.
 *
 * On Android the Keycloak round-trip ends with a real deep link back into the app
 * (`aeevente://auth?code=…`): a Custom Tab cannot hand its result back in-process, so
 * `expo-web-browser` waits on a `Linking` event instead. expo-router listens to that same
 * event, and — finding no file behind the `/auth` path — used to render its "Unmatched
 * Route" screen over the app. iOS never hits this: `ASWebAuthenticationSession` captures
 * the callback natively and nothing reaches `Linking` at all.
 *
 * Returning an empty path drops the URL *for the router only*; expo-web-browser's own
 * listener still receives it and `signIn()` completes normally. Nothing is lost by not
 * routing it — where the app goes after sign-in follows the session state
 * (see `app/index.tsx`), never this URL.
 */
export const redirectSystemPath: NonNullable<
	NativeIntent['redirectSystemPath']
> = ({ path }) => (path.startsWith(AUTH_REDIRECT_URI) ? '' : path);
