/** The signed-in person as Keycloak describes them — the API carries only a `username`. */
export interface AuthUser {
	name: string | null;
	givenName: string | null;
	familyName: string | null;
	email: string | null;
	username: string | null;
}

/** Establishes the identity the API trusts: it has no login of its own, only Keycloak JWTs. */
export interface AuthService {
	/** Resume the session persisted on the last run. Call once at start-up. */
	restore(): Promise<boolean>;

	/** `false` when the user dismissed the IdP page; rejects if the exchange failed. */
	signIn(): Promise<boolean>;

	/** End the session locally and at the identity provider. Always resolves. */
	signOut(): Promise<void>;

	isAuthenticated(): boolean;

	/** Display-only: null when unavailable, so callers fall back to the username. */
	fetchUser(): Promise<AuthUser | null>;
}
