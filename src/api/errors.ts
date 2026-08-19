import axios from 'axios';

/**
 * The error body every AEE Manager endpoint returns (NestJS' default shape):
 * `{ "message": "Missing bearer token", "error": "Unauthorized", "statusCode": 401 }`.
 * Validation failures put an array of messages in `message`.
 */
interface ApiErrorBody {
	message?: string | string[];
	error?: string;
	statusCode?: number;
}

/**
 * A failed API call, normalized so callers never have to unwrap an `AxiosError`.
 * {@link message} is safe to show to the user; {@link status} lets the UI branch
 * (401 → sign in again, 403 → wrong role on this tenant, 409 → conflict…).
 */
export class ApiError extends Error {
	/** HTTP status, or null when the request never got a response (offline, DNS, timeout). */
	readonly status: number | null;
	/** Every validation message when the server sent a list; otherwise a single entry. */
	readonly details: string[];
	/** True when the request failed before reaching the server — worth a retry. */
	readonly isNetworkError: boolean;

	constructor(
		message: string,
		status: number | null,
		details: string[] = [],
		isNetworkError = false,
	) {
		super(message);
		this.name = 'ApiError';
		this.status = status;
		this.details = details;
		this.isNetworkError = isNetworkError;
	}

	/** The caller's token is missing/expired — the session must be re-established. */
	get isUnauthorized(): boolean {
		return this.status === 401;
	}

	/** Authenticated, but lacking the role this tenant requires for the operation. */
	get isForbidden(): boolean {
		return this.status === 403;
	}
}

/** French fallbacks for the cases the server can't describe itself. */
const NETWORK_MESSAGE = 'Serveur injoignable. Vérifiez votre connexion.';
const TIMEOUT_MESSAGE = 'Le serveur met trop de temps à répondre.';
const UNKNOWN_MESSAGE = 'Une erreur inattendue est survenue.';

/**
 * Convert anything thrown by the client into an {@link ApiError}. Every call in
 * `src/api` funnels through here, so a caller can always `catch (e)` and read
 * `e.message` / `e.status` without knowing axios exists.
 */
export function toApiError(error: unknown): ApiError {
	if (error instanceof ApiError) {
		return error;
	}

	if (axios.isAxiosError(error)) {
		const response = error.response;
		if (!response) {
			const timedOut =
				error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT';
			return new ApiError(
				timedOut ? TIMEOUT_MESSAGE : NETWORK_MESSAGE,
				null,
				[],
				true,
			);
		}

		const body = (response.data ?? {}) as ApiErrorBody;
		const details = Array.isArray(body.message)
			? body.message
			: body.message
				? [body.message]
				: [];
		// Prefer the server's own wording; fall back to its short error label, then
		// to the status line — never leave the user with an empty message.
		const message =
			details[0] ??
			body.error ??
			`${response.status} ${response.statusText || UNKNOWN_MESSAGE}`;

		return new ApiError(message, response.status, details);
	}

	if (error instanceof Error) {
		return new ApiError(error.message || UNKNOWN_MESSAGE, null);
	}

	return new ApiError(UNKNOWN_MESSAGE, null);
}
