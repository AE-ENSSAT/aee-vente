import * as SecureStore from 'expo-secure-store';

/**
 * What must survive an app restart. Only the **refresh token** is stored, never the access
 * token: those live minutes, so persisting them buys nothing and only widens the window in
 * which a copy on disk is useful. Start-up exchanges the refresh token for a fresh one.
 *
 * The selected tenant rides along — not a secret, but part of "who is signed in and where",
 * so the same sign-out clears it.
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
