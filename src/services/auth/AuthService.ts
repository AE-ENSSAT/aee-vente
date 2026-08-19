/**
 * The signed-in person as the identity provider describes them.
 *
 * The AEE Manager API deliberately knows almost nothing about people: `MeProfileDto`
 * carries a `username` (Keycloak's `preferred_username`, e.g. `aee-test`) and nothing
 * else, so every human-readable detail has to come from the realm itself.
 */
export interface AuthUser {
	/** Full name as the realm holds it, e.g. `AEE TEST`. */
	name: string | null;
	givenName: string | null;
	familyName: string | null;
	email: string | null;
	/** Login handle — the same value the API returns as `username`. */
	username: string | null;
}

/**
 * Abstraction over establishing the identity the AEE Manager API trusts. The API has no
 * login endpoint of its own — it only validates JWTs from the Keycloak realm — so this is
 * where "signing in" happens. The UI depends on this interface, not on Keycloak, so the
 * identity provider can be swapped (or mocked in dev) without touching a screen.
 */
export interface AuthService {
	/**
	 * Re-establish a session from what was persisted on the last run. Resolves true when
	 * the app is signed in again — call it once at start-up before deciding which screen
	 * to show.
	 */
	restore(): Promise<boolean>;

	/**
	 * Establish a session by sending the user through the identity provider's own sign-in
	 * page. Resolves `false` when they dismissed it without signing in, `true` on success;
	 * rejects with an {@link ApiError} if the exchange itself failed.
	 */
	signIn(): Promise<boolean>;

	/** End the session locally and at the identity provider. Always resolves. */
	signOut(): Promise<void>;

	/** True while a usable session is held. */
	isAuthenticated(): boolean;

	/**
	 * The identity provider's view of the signed-in person. Resolves null when there is no
	 * session or the lookup failed: this is display-only, so a caller falls back to the
	 * username rather than treating it as a broken session.
	 */
	fetchUser(): Promise<AuthUser | null>;
}
