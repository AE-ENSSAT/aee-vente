import {
	api,
	type JoinResultDto,
	type MeDto,
	type MeProfileDto,
	type MyTenantDto,
} from '@/src/api';

/**
 * Who the signed-in user is, and where they can sell. A thin wrapper over the generated
 * client: the typed client *is* the abstraction, so there is no interface/impl pair here.
 */
export const accountService = {
	/** Identity + whether the user may provision tenants (platform operator). */
	async me(): Promise<MeDto> {
		const { data } = await api.me();
		return data;
	},

	/** The chosen `tenantId` becomes the `X-Tenant-Id` of every later call. */
	async myTenants(): Promise<MyTenantDto[]> {
		const { data } = await api.myTenants();
		return data;
	},

	/** Roles and permissions **on the selected tenant** — `canSell` gates the sell screen. */
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
