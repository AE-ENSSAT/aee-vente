/**
 * The bearer token + tenant every request needs, in one mutable holder the interceptors
 * read — so a refresh or a tenant switch never rebuilds the axios instance. Knows nothing
 * about Keycloak: the auth service pushes tokens in and registers {@link setRefreshHandler}.
 */

/** Refreshes the access token; resolves the new one, or null when the session is over. */
type RefreshHandler = () => Promise<string | null>;

/** Refresh this early, so a request never leaves with a token that dies in flight. */
const EXPIRY_SKEW_MS = 30_000;

let accessToken: string | null = null;
/** Epoch ms at which {@link accessToken} stops being usable; 0 when unknown. */
let expiresAt = 0;
let tenantId: string | null = null;
let refreshHandler: RefreshHandler | null = null;
let onSessionExpired: (() => void) | null = null;
// De-duplicates concurrent refreshes: Keycloak rotates refresh tokens, so parallel
// exchanges would invalidate each other.
let inFlightRefresh: Promise<string | null> | null = null;

export const apiSession = {
	/** The current bearer token, or null when signed out. */
	getAccessToken(): string | null {
		return accessToken;
	},

	/** `expiresInSeconds` comes from the IdP; omit it and the token is replaced only on a 401. */
	setAccessToken(token: string | null, expiresInSeconds?: number): void {
		accessToken = token;
		expiresAt =
			token && expiresInSeconds
				? Date.now() + expiresInSeconds * 1000
				: 0;
	},

	/**
	 * Inside the renewal window, or already dead. Checked before sending, which turns a
	 * guaranteed 401-then-retry into a single request.
	 */
	isExpiring(): boolean {
		return (
			accessToken !== null &&
			expiresAt !== 0 &&
			Date.now() >= expiresAt - EXPIRY_SKEW_MS
		);
	},

	/**
	 * Sent as `X-Tenant-Id`. Null before one is picked: only `/me`, `/me/tenants` and
	 * `/tenants/join` work then, the rest answer 403.
	 */
	getTenantId(): string | null {
		return tenantId;
	},

	setTenantId(id: string | null): void {
		tenantId = id;
	},

	/** True once a token is present (a tenant may still be pending). */
	get isAuthenticated(): boolean {
		return accessToken !== null;
	},

	/** Registered by the auth service so the client can recover from a 401 on its own. */
	setRefreshHandler(handler: RefreshHandler | null): void {
		refreshHandler = handler;
	},

	/**
	 * Called when a refresh fails and the session is truly over, so the app can route
	 * back to the login screen from wherever it is.
	 */
	setOnSessionExpired(handler: (() => void) | null): void {
		onSessionExpired = handler;
	},

	/**
	 * Refresh the access token, collapsing concurrent callers onto one exchange.
	 * Resolves null when there is nothing to refresh or the refresh was rejected —
	 * in which case the session is cleared and {@link setOnSessionExpired} fires.
	 */
	async refresh(): Promise<string | null> {
		if (!refreshHandler) {
			return null;
		}
		if (!inFlightRefresh) {
			inFlightRefresh = refreshHandler()
				.catch(() => null)
				.finally(() => {
					inFlightRefresh = null;
				});
		}
		const token = await inFlightRefresh;
		if (!token) {
			apiSession.clear();
			onSessionExpired?.();
		}
		return token;
	},

	/** Drop the token and tenant (sign-out, or an unrecoverable 401). */
	clear(): void {
		accessToken = null;
		expiresAt = 0;
		tenantId = null;
	},
};
