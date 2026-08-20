import axios from 'axios';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { KEYCLOAK_CLIENT_ID, KEYCLOAK_ENDPOINTS } from '@/constants/api';
import { USER_AGENT } from '@/constants/app';
import { ApiError } from '@/src/api/errors';
import { apiSession } from '@/src/api/session';
import type { AuthService, AuthUser } from './AuthService';
import { AUTH_REDIRECT_URI } from './redirectUri';
import { tokenStorage } from './tokenStorage';

/** Keycloak's token response (the fields the app uses). */
interface TokenResponse {
	access_token: string;
	refresh_token?: string;
	/** Needed as `id_token_hint` to end the SSO session cleanly on sign-out. */
	id_token?: string;
	/** Access-token lifetime in seconds. */
	expires_in: number;
}

/** The subset of the realm's discovery document this flow needs. */
const DISCOVERY: AuthSession.DiscoveryDocument = {
	authorizationEndpoint: KEYCLOAK_ENDPOINTS.authorize,
	tokenEndpoint: KEYCLOAK_ENDPOINTS.token,
	endSessionEndpoint: KEYCLOAK_ENDPOINTS.logout,
};

/** The OIDC `userinfo` claims this app displays. */
interface UserInfoResponse {
	name?: string;
	given_name?: string;
	family_name?: string;
	email?: string;
	preferred_username?: string;
}

/** Keycloak's OAuth error body. */
interface KeycloakErrorBody {
	error?: string;
	error_description?: string;
}

/** Keycloak's endpoints are form-encoded; the User-Agent matches the API client's. */
const FORM_HEADERS = {
	'Content-Type': 'application/x-www-form-urlencoded',
	'User-Agent': USER_AGENT,
};

/** French wording for the OAuth error codes a merchant can actually hit. */
const ERROR_MESSAGES: Record<string, string> = {
	invalid_grant: 'Session expirée, reconnectez-vous.',
	invalid_client: 'Client Keycloak inconnu — vérifiez KEYCLOAK_CLIENT_ID.',
	unauthorized_client:
		"Ce client Keycloak n'autorise pas ce mode de connexion (activez « Standard flow »).",
	invalid_request: 'Requête de connexion invalide.',
};

/**
 * {@link AuthService} over the Keycloak realm that signs the API's bearer tokens.
 *
 * SSO: authorization code + PKCE, with Keycloak's own page in a system browser session, so
 * the app never sees a password and the client can stay public with no secret.
 */
export class KeycloakAuthService implements AuthService {
	private refreshToken: string | null = null;
	/** Kept only to pass as `id_token_hint` on sign-out; useless once the session ends. */
	private idToken: string | null = null;

	constructor() {
		// Let the API client recover from a 401 by itself: one refresh, then a replay.
		apiSession.setRefreshHandler(() => this.refreshAccessToken());
	}

	isAuthenticated(): boolean {
		return apiSession.isAuthenticated;
	}

	/**
	 * The API returns only a login handle, so real names come from the realm's userinfo
	 * endpoint. Never throws: a display name isn't worth failing a session over.
	 */
	async fetchUser(): Promise<AuthUser | null> {
		const token = apiSession.getAccessToken();
		if (!token) {
			return null;
		}
		try {
			const { data } = await axios.get<UserInfoResponse>(
				KEYCLOAK_ENDPOINTS.userInfo,
				{
					headers: {
						Authorization: `Bearer ${token}`,
						'User-Agent': USER_AGENT,
					},
					timeout: 10_000,
				},
			);
			return {
				name: data.name ?? null,
				givenName: data.given_name ?? null,
				familyName: data.family_name ?? null,
				email: data.email ?? null,
				username: data.preferred_username ?? null,
			};
		} catch {
			return null;
		}
	}

	async restore(): Promise<boolean> {
		const stored = await tokenStorage.getRefreshToken();
		if (!stored) {
			return false;
		}
		this.refreshToken = stored;
		// Only the refresh token is persisted; a rejected refresh means the session lapsed.
		return (await this.refreshAccessToken()) !== null;
	}

	async signIn(): Promise<boolean> {
		// PKCE: the verifier never leaves the app, so an intercepted code is worthless —
		// which is what lets a public client skip a secret.
		const request = new AuthSession.AuthRequest({
			clientId: KEYCLOAK_CLIENT_ID,
			redirectUri: AUTH_REDIRECT_URI,
			responseType: AuthSession.ResponseType.Code,
			scopes: ['openid', 'profile', 'email'],
			usePKCE: true,
		});

		const result = await request.promptAsync(DISCOVERY);

		// Dismissed or cancelled: not an error.
		if (result.type !== 'success') {
			if (result.type === 'error') {
				throw toAuthError(result.error ?? undefined);
			}
			return false;
		}

		const tokens = await this.requestToken({
			grant_type: 'authorization_code',
			code: result.params.code,
			redirect_uri: AUTH_REDIRECT_URI,
			code_verifier: request.codeVerifier ?? '',
		});
		await this.adopt(tokens);
		return true;
	}

	async signOut(): Promise<void> {
		const token = this.refreshToken;
		const idToken = this.idToken;
		this.refreshToken = null;
		this.idToken = null;
		apiSession.clear();
		await tokenStorage.clear();

		// Both steps are best-effort: the local session is already gone either way.

		// 1. Back channel — revoke the refresh token so it can't be replayed.
		if (token) {
			try {
				await axios.post(
					KEYCLOAK_ENDPOINTS.logout,
					new URLSearchParams({
						client_id: KEYCLOAK_CLIENT_ID,
						refresh_token: token,
					}).toString(),
					{ headers: FORM_HEADERS, timeout: 5_000 },
				);
			} catch {
				// Best-effort, as above.
			}
		}

		// 2. Front channel. Without it Keycloak's SSO cookie survives and the next
		// "Se connecter" silently returns the SAME seller — on a shared POS, a real bug.
		try {
			const params = new URLSearchParams({
				post_logout_redirect_uri: AUTH_REDIRECT_URI,
				// Keycloak needs one of these; the id_token makes the logout silent.
				...(idToken
					? { id_token_hint: idToken }
					: { client_id: KEYCLOAK_CLIENT_ID }),
			});
			await WebBrowser.openAuthSessionAsync(
				`${KEYCLOAK_ENDPOINTS.logout}?${params.toString()}`,
				AUTH_REDIRECT_URI,
			);
		} catch {
			// Best-effort, as above.
		}
	}

	/** Null when there is no refresh token or Keycloak refused it — the session is then over. */
	private async refreshAccessToken(): Promise<string | null> {
		if (!this.refreshToken) {
			return null;
		}
		try {
			const tokens = await this.requestToken({
				grant_type: 'refresh_token',
				refresh_token: this.refreshToken,
			});
			await this.adopt(tokens);
			return tokens.access_token;
		} catch {
			// The refresh token is spent or revoked: drop it so we stop retrying.
			this.refreshToken = null;
			await tokenStorage.setRefreshToken(null);
			return null;
		}
	}

	/** Take a token response into the API session and onto disk. */
	private async adopt(tokens: TokenResponse): Promise<void> {
		apiSession.setAccessToken(tokens.access_token, tokens.expires_in);
		// Keycloak rotates refresh tokens by default — always keep the newest one.
		if (tokens.refresh_token) {
			this.refreshToken = tokens.refresh_token;
			await tokenStorage.setRefreshToken(tokens.refresh_token);
		}
		// Refresh responses carry a new id_token too; keep the latest for `id_token_hint`.
		if (tokens.id_token) {
			this.idToken = tokens.id_token;
		}
	}

	/** POST the token endpoint, mapping OAuth errors onto {@link ApiError}. */
	private async requestToken(
		params: Record<string, string>,
	): Promise<TokenResponse> {
		try {
			const { data } = await axios.post<TokenResponse>(
				KEYCLOAK_ENDPOINTS.token,
				new URLSearchParams({
					client_id: KEYCLOAK_CLIENT_ID,
					...params,
				}).toString(),
				{ headers: FORM_HEADERS, timeout: 15_000 },
			);
			return data;
		} catch (error) {
			throw toAuthError(error);
		}
	}
}

/** Keycloak speaks OAuth, not NestJS — map its error body onto {@link ApiError}. */
function toAuthError(error: unknown): ApiError {
	// Errors the IdP reported on the redirect itself (bad redirect URI, disabled flow…),
	// which come back as query params rather than an HTTP error body.
	if (error instanceof AuthSession.AuthError) {
		return new ApiError(
			ERROR_MESSAGES[error.code] ??
				error.description ??
				'Connexion impossible.',
			null,
			[error.code],
		);
	}
	if (axios.isAxiosError(error)) {
		if (!error.response) {
			return new ApiError(
				"Serveur d'authentification injoignable.",
				null,
				[],
				true,
			);
		}
		const body = (error.response.data ?? {}) as KeycloakErrorBody;
		const code = body.error ?? '';
		const message =
			ERROR_MESSAGES[code] ??
			body.error_description ??
			'Connexion impossible.';
		return new ApiError(message, error.response.status, [code]);
	}
	return new ApiError('Connexion impossible.', null);
}
