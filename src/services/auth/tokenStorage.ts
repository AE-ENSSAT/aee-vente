import * as SecureStore from 'expo-secure-store';

/**
 * Persistence for the pieces of a session that must survive an app restart.
 *
 * Only the **refresh token** is stored, never the access token: access tokens live a few
 * minutes, so persisting them buys nothing and widens the window in which a copy on disk
 * is useful to an attacker. On start-up the refresh token is exchanged for a fresh access
 * token instead (see `KeycloakAuthService.restore`), which also keeps every stored value
 * comfortably under SecureStore's Android size warning.
 *
 * The selected tenant rides along here too — it isn't a secret, but it is part of "who is
 * signed in and where", so it is cleared by the same sign-out.
 */
const REFRESH_TOKEN_KEY = 'aee.auth.refreshToken';
const TENANT_ID_KEY = 'aee.auth.tenantId';

/** SecureStore throws when the keychain is unavailable; a missing value is never fatal. */
async function read(key: string): Promise<string | null> {
	try {
		return await SecureStore.getItemAsync(key);
	} catch {
		return null;
	}
}

async function write(key: string, value: string | null): Promise<void> {
	try {
		if (value === null) {
			await SecureStore.deleteItemAsync(key);
		} else {
			await SecureStore.setItemAsync(key, value);
		}
	} catch {
		// Storage failures degrade the session to "until the app is killed" — never a crash.
	}
}

export const tokenStorage = {
	getRefreshToken: () => read(REFRESH_TOKEN_KEY),
	setRefreshToken: (token: string | null) => write(REFRESH_TOKEN_KEY, token),
	getTenantId: () => read(TENANT_ID_KEY),
	setTenantId: (id: string | null) => write(TENANT_ID_KEY, id),

	/** Wipe everything belonging to the signed-in user. */
	async clear(): Promise<void> {
		await Promise.all([
			write(REFRESH_TOKEN_KEY, null),
			write(TENANT_ID_KEY, null),
		]);
	},
};
