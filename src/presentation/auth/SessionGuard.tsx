import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';

/**
 * Returns to the login screen when a live session ends on its own (refresh token expired or
 * revoked), instead of leaving a seller mid-shift watching every call fail.
 *
 * Only a `signedIn → signedOut` transition redirects: the app starts signed out on the login
 * screen anyway, and an explicit sign-out resets the stack itself. Renders nothing.
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
