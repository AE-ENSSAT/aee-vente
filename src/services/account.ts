import {
	api,
	type JoinResultDto,
	type MeDto,
	type MeProfileDto,
	type MyTenantDto,
} from '@/src/api';

/**
 * Who the signed-in user is, and where they can sell.
 *
 * A thin, intention-revealing wrapper over the generated client: it unwraps axios'
 * `{ data }` and gives the calls names the app speaks in. No interface + implementation
 * pair here — the typed client *is* the abstraction, and a second one would only add
 * indirection.
 */
export const accountService = {
	/** Identity + whether the user may provision tenants (platform operator). */
	async me(): Promise<MeDto> {
		const { data } = await api.me();
		return data;
	},

	/**
	 * The tenants this user belongs to, with their roles in each. Drives tenant
	 * selection: the chosen `tenantId` becomes the `X-Tenant-Id` of every later call.
	 */
	async myTenants(): Promise<MyTenantDto[]> {
		const { data } = await api.myTenants();
		return data;
	},

	/**
	 * Roles and resolved permissions **on the currently selected tenant** — notably
	 * `permissions.canSell`, which gates the sell screen.
	 */
	async profile(): Promise<MeProfileDto> {
		const { data } = await api.profile();
		return data;
	},

	/** Join a tenant with an invite code, returning the granted role. */
	async joinTenant(code: string): Promise<JoinResultDto> {
		const { data } = await api.join(null, { code });
		return data;
	},
};
