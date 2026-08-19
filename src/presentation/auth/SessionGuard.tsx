import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';

/**
 * Sends the app back to the login screen when a live session ends on its own — the refresh
 * token expired or was revoked, so the API client gave up (see `apiSession.refresh`).
 *
 * Without this, a seller mid-shift would sit on the sell page watching every call fail with
 * no obvious way back. Renders nothing; it only watches.
 *
 * Only a `signedIn → signedOut` transition redirects: the app *starts* signed out, and that
 * first render is already the login screen. Sign-out from the settings screen resets the
 * navigation stack itself, so it arrives there before this fires.
 */
export function SessionGuard() {
	const { status } = useAuth();
	const router = useRouter();
	const wasSignedIn = useRef(false);

	useEffect(() => {
		if (status === 'signedIn') {
			wasSignedIn.current = true;
			return;
		}
		if (status === 'signedOut' && wasSignedIn.current) {
			wasSignedIn.current = false;
			router.replace('/');
		}
	}, [status, router]);

	return null;
}
