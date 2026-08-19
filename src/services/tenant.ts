import { apiSession } from '@/src/api';
import { tokenStorage } from './auth/tokenStorage';

/**
 * The tenant (association) every API call is scoped to.
 *
 * A user can belong to several — `GET /me/tenants` lists them — and the chosen one is
 * sent as `X-Tenant-Id` on every request. It is kept in two places on purpose: in
 * {@link apiSession} because that is what the client's interceptor reads, and on disk so
 * a seller who only ever works for one association is never asked to pick again.
 */
export const tenantService = {
	/** The selected tenant id, or null when none has been chosen yet. */
	getCurrent(): string | null {
		return apiSession.getTenantId();
	},

	/** Re-apply the tenant chosen on a previous run. Resolves the restored id, if any. */
	async restore(): Promise<string | null> {
		const stored = await tokenStorage.getTenantId();
		apiSession.setTenantId(stored);
		return stored;
	},

	/** Switch tenant (or clear it with null), remembering the choice. */
	async select(tenantId: string | null): Promise<void> {
		apiSession.setTenantId(tenantId);
		await tokenStorage.setTenantId(tenantId);
	},
};
