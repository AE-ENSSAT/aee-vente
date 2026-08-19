import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from 'react';
import { apiSession, type MeProfileDto, type MyTenantDto } from '@/src/api';
import { accountService } from '@/src/services/account';
import { authService } from '@/src/services/auth';
import type { AuthUser } from '@/src/services/auth/AuthService';
import { tenantService } from '@/src/services/tenant';

/**
 * `loading` covers the start-up attempt to resume the previous session — the app must not
 * flash the login screen at a seller who is still signed in.
 */
export type AuthStatus = 'loading' | 'signedOut' | 'signedIn';

interface AuthContextValue {
	status: AuthStatus;
	/** Tenants the user belongs to, with their roles in each. */
	tenants: MyTenantDto[];
	/** The tenant every API call is scoped to, or null while one is being chosen. */
	tenant: MyTenantDto | null;
	/** Roles + permissions on {@link tenant}; null until one is selected. */
	profile: MeProfileDto | null;
	/**
	 * The signed-in person as Keycloak describes them — a real name, which the API's
	 * profile does not carry. Null while it loads, or if the realm could not be reached.
	 */
	user: AuthUser | null;
	/** True when the API says this user may take payments here (`permissions.canSell`). */
	canSell: boolean;
	/**
	 * True when signed in but no tenant is settled on — the app must ask which one. Always
	 * true right after a sign-in; after a restored session, only when nothing was
	 * remembered.
	 */
	needsTenantChoice: boolean;
	/**
	 * Start the SSO round-trip. Resolves false when the user dismissed the identity
	 * provider's page without signing in, so the caller can stay put silently.
	 */
	signIn: () => Promise<boolean>;
	signOut: () => Promise<void>;
	selectTenant: (tenantId: string) => Promise<void>;
	/** Join a new association with an invite code, then switch to it. */
	joinTenant: (code: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Owns the signed-in session: the Keycloak token (via `authService`), which tenant the
 * user is selling for, and what the API says they're allowed to do there.
 *
 * Screens read this instead of touching `apiSession` — that holder is plumbing for the
 * client's interceptors, not app state.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
	const [status, setStatus] = useState<AuthStatus>('loading');
	const [tenants, setTenants] = useState<MyTenantDto[]>([]);
	const [tenantId, setTenantId] = useState<string | null>(null);
	const [profile, setProfile] = useState<MeProfileDto | null>(null);
	const [user, setUser] = useState<AuthUser | null>(null);

	/**
	 * Load everything that depends on the token: the user's tenants, then the profile for
	 * whichever tenant applies.
	 *
	 * `preselect` separates the two ways in. Resuming a session at start-up settles on an
	 * association by itself — the remembered one, or a lone membership, which needs no
	 * question — so a seller mid-shift is never interrupted. A fresh sign-in passes false
	 * and always asks: the POS is handed between sellers, so the association the previous
	 * one worked for must not carry over silently (see `app/tenant.tsx`).
	 *
	 * A remembered tenant is honoured only while the user still belongs to it (they may
	 * have been removed since).
	 */
	const loadSession = useCallback(async (preselect: boolean) => {
		// Independent lookups — the realm knows the person, the API knows where they sell.
		const [list, who] = await Promise.all([
			accountService.myTenants(),
			authService.fetchUser(),
		]);
		setTenants(list);
		setUser(who);

		if (!preselect) {
			// Drop the stored tenant as well, so nothing can go out under the previous
			// seller's `X-Tenant-Id` while this one is still choosing.
			await tenantService.select(null);
			setTenantId(null);
			setProfile(null);
			setStatus('signedIn');
			return;
		}

		const remembered = await tenantService.restore();
		const valid = list.some((t) => t.tenantId === remembered);
		const chosen = valid
			? remembered
			: list.length === 1
				? list[0].tenantId
				: null;

		if (chosen !== remembered) {
			await tenantService.select(chosen);
		}
		setTenantId(chosen);
		// The profile is tenant-scoped, so it can only be fetched once one is settled.
		setProfile(chosen ? await accountService.profile() : null);
		setStatus('signedIn');
	}, []);

	// Resume the previous session at start-up, and make an unrecoverable 401 anywhere in
	// the app fall back to the login screen.
	useEffect(() => {
		let active = true;

		apiSession.setOnSessionExpired(() => {
			if (active) {
				setStatus('signedOut');
				setTenants([]);
				setTenantId(null);
				setProfile(null);
				setUser(null);
			}
		});

		(async () => {
			const restored = await authService.restore();
			if (!active) {
				return;
			}
			if (!restored) {
				setStatus('signedOut');
				return;
			}
			try {
				await loadSession(true);
			} catch {
				// The token survived but the API is unreachable (or rejected us). Treat it
				// as signed out rather than stranding the app on a spinner.
				if (active) {
					setStatus('signedOut');
				}
			}
		})();

		return () => {
			active = false;
			apiSession.setOnSessionExpired(null);
		};
	}, [loadSession]);

	const signIn = useCallback(async () => {
		const signedIn = await authService.signIn();
		if (signedIn) {
			// `false`: never inherit an association across a sign-in — always ask.
			await loadSession(false);
		}
		return signedIn;
	}, [loadSession]);

	const signOut = useCallback(async () => {
		await authService.signOut();
		setStatus('signedOut');
		setTenants([]);
		setTenantId(null);
		setProfile(null);
		setUser(null);
	}, []);

	const selectTenant = useCallback(async (id: string) => {
		await tenantService.select(id);
		setTenantId(id);
		setProfile(await accountService.profile());
	}, []);

	const joinTenant = useCallback(
		async (code: string) => {
			const { tenantId: joined } = await accountService.joinTenant(code);
			setTenants(await accountService.myTenants());
			await selectTenant(joined);
		},
		[selectTenant],
	);

	const value = useMemo<AuthContextValue>(() => {
		const tenant = tenants.find((t) => t.tenantId === tenantId) ?? null;
		return {
			status,
			tenants,
			tenant,
			profile,
			user,
			canSell: profile?.permissions.canSell ?? false,
			needsTenantChoice: status === 'signedIn' && tenantId === null,
			signIn,
			signOut,
			selectTenant,
			joinTenant,
		};
	}, [
		status,
		tenants,
		tenantId,
		profile,
		user,
		signIn,
		signOut,
		selectTenant,
		joinTenant,
	]);

	return (
		<AuthContext.Provider value={value}>{children}</AuthContext.Provider>
	);
}

export function useAuth(): AuthContextValue {
	const ctx = useContext(AuthContext);
	if (!ctx) {
		throw new Error('useAuth must be used within an AuthProvider');
	}
	return ctx;
}
