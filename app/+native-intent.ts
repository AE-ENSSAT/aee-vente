import type { NativeIntent } from 'expo-router';
import { AUTH_REDIRECT_URI } from '@/src/services/auth/redirectUri';

/**
 * Keeps the SSO callback out of the router.
 *
 * On Android the callback comes back as a real deep link, because a Custom Tab cannot hand
 * its result back in-process the way `ASWebAuthenticationSession` does. expo-router hears
 * the same `Linking` event and, finding no route, renders "Unmatched Route" over the app.
 *
 * Returning an empty path drops the URL for the router only — expo-web-browser's own
 * listener still gets it, and where the app goes after sign-in follows session state.
 */
export const redirectSystemPath: NonNullable<
	NativeIntent['redirectSystemPath']
> = ({ path }) => (path.startsWith(AUTH_REDIRECT_URI) ? '' : path);
