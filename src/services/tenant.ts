import { apiSession } from '@/src/api';
import { tokenStorage } from './auth/tokenStorage';

/**
 * The tenant every API call is scoped to, sent as `X-Tenant-Id`. Held in two places on
 * purpose: in {@link apiSession}, which the interceptor reads, and on disk, so a seller with
 * one association is never asked again.
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
