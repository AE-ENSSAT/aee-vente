import type {
	AxiosRequestConfig,
	OpenAPIClient,
	OperationResponse,
	Parameters,
	UnknownParamsObject,
} from 'openapi-client-axios';

declare namespace Components {
	namespace Schemas {
		export interface AcademicYearResponseDto {
			id: string; // uuid
			label: string;
			startsOn: string; // date
			endsOn: string; // date
			isCurrent: boolean;
		}
		export interface AddGridItemDto {
			productId: string; // uuid
			position?: number;
		}
		export interface AdherentSearchResultDto {
			id: string; // uuid
			lastName: string;
			firstName: string;
			email: string;
			isMember: boolean;
		}
		export interface CartItemDto {
			/**
			 * Top-level product id (the group, or a leaf product).
			 */
			productId: string; // uuid
			/**
			 * Chosen variant; required when the product has variants.
			 */
			variantId?: string; // uuid
			/**
			 * Chosen option ids (from the product’s option groups).
			 */
			optionIds?: string /* uuid */[];
			/**
			 * example:
			 * 2
			 */
			qty: number;
		}
		export interface ConfirmOrderDto {
			/**
			 * SumUp transaction id from the device SDK (TransactionDone).
			 */
			sumupTxId: string;
		}
		export interface CreateAcademicYearDto {
			/**
			 * example:
			 * 2025-2026
			 */
			label: string;
			/**
			 * example:
			 * 2025-09-01
			 */
			startsOn: string; // date
			/**
			 * example:
			 * 2026-08-31
			 */
			endsOn: string; // date
			/**
			 * Mark this year current (unsets any other current year).
			 */
			isCurrent?: boolean;
		}
		export interface CreateGridDto {
			/**
			 * example:
			 * Bar
			 */
			name: string;
			position?: number;
		}
		export interface CreateInviteCodeDto {
			/**
			 * Role granted on join
			 */
			role: 'admin' | 'manager' | 'vendeur' | 'member';
			/**
			 * Max redemptions
			 */
			maxUses?: number;
			/**
			 * TTL in minutes
			 */
			expiresInMinutes?: number;
		}
		export interface CreateMembershipDto {
			academicYearId: string; // uuid
			status?: 'active' | 'expired';
		}
		export interface CreateOptionDto {
			/**
			 * example:
			 * Extra bacon
			 */
			name: string;
			/**
			 * Surcharge added to the line, in integer cents.
			 */
			priceDeltaCents?: number;
			position?: number;
		}
		export interface CreateOptionGroupDto {
			/**
			 * example:
			 * Sauce
			 */
			name: string;
			/**
			 * Minimum choices the buyer must select.
			 */
			minSelect?: number;
			/**
			 * Maximum choices the buyer may select (≥ 1, ≥ minSelect).
			 */
			maxSelect?: number;
			position?: number;
		}
		export interface CreateOrderDto {
			items: [CartItemDto, ...CartItemDto[]];
			paymentMean: 'CASH' | 'TAP_TO_PAY' | 'CARD_READER';
			/**
			 * Adherent to attribute the sale to (member pricing).
			 */
			memberId?: string; // uuid
			/**
			 * Client-generated idempotency key (recommended for cash; a refused card order should be retried under a NEW key).
			 */
			idempotencyKey?: string;
		}
		export interface CreatePersonDto {
			/**
			 * example:
			 * Dupont
			 */
			lastName: string;
			/**
			 * example:
			 * Marie
			 */
			firstName: string;
			/**
			 * example:
			 * marie.dupont@school.fr
			 */
			email: string; // email
			/**
			 * example:
			 * 2004-05-12
			 */
			birthDate?: string; // date
		}
		export interface CreateProductDto {
			/**
			 * example:
			 * Bière blonde 25cl
			 */
			name: string;
			/**
			 * External price in integer cents (D9). Required together with memberPriceCents for a sellable product; omit both to create a variant group (its variants carry the prices).
			 * example:
			 * 250
			 */
			externalPriceCents?: number;
			/**
			 * Member (adherent) price in integer cents. Required together with externalPriceCents.
			 * example:
			 * 200
			 */
			memberPriceCents?: number;
			/**
			 * Stock policy (D25). Defaults to `tracked`.
			 */
			stockPolicy?: 'tracked' | 'oversell' | 'untracked';
			/**
			 * Initial stock (ignored when stock policy is `untracked`).
			 */
			initialStock?: number;
		}
		export interface CreateTenantDto {
			/**
			 * example:
			 * aee
			 */
			slug: string; // ^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$
			/**
			 * example:
			 * AEE — Association des Élèves de l’ENSSAT
			 */
			name: string;
			/**
			 * Keycloak sub of the first admin (granted the admin tuple).
			 */
			firstAdminSub?: string;
		}
		export interface GridItemOptionDto {
			id: string; // uuid
			name: string;
			priceDeltaCents: number;
		}
		export interface GridItemOptionGroupDto {
			id: string; // uuid
			name: string;
			minSelect: number;
			maxSelect: number;
			options: GridItemOptionDto[];
		}
		export interface GridItemViewDto {
			productId: string; // uuid
			name: string;
			/**
			 * External price for a leaf; null for a variant group.
			 */
			externalPriceCents: number | null;
			memberPriceCents: number | null;
			stockQty: number | null;
			stockPolicy: 'tracked' | 'oversell' | 'untracked';
			imageUrl: string | null;
			position: number;
			/**
			 * Number of variants; > 0 means the POS opens a panel.
			 */
			variantCount: number;
			variants: VariantViewDto[];
			optionGroups: GridItemOptionGroupDto[];
		}
		export interface GridResponseDto {
			id: string; // uuid
			name: string;
			active: boolean;
			position: number;
		}
		export interface GridViewDto {
			id: string; // uuid
			name: string;
			active: boolean;
			position: number;
			items: GridItemViewDto[];
		}
		export interface InviteCodeCreatedDto {
			id: string; // uuid
			/**
			 * Raw code — shown only once
			 */
			code: string;
			roleOnJoin: 'admin' | 'manager' | 'vendeur' | 'member';
			maxUses: number;
			expiresAt: string; // date-time
		}
		export interface InviteCodeDto {
			id: string; // uuid
			roleOnJoin: 'admin' | 'manager' | 'vendeur' | 'member';
			maxUses: number;
			usedCount: number;
			revoked: boolean;
			expiresAt: string; // date-time
		}
		export interface JoinResultDto {
			tenantId: string; // uuid
			role: 'admin' | 'manager' | 'vendeur' | 'member';
		}
		export interface JoinTenantDto {
			/**
			 * Invite code (digits)
			 * example:
			 * 48213907
			 */
			code: string; // ^[0-9]{4,16}$
		}
		export interface MeDto {
			/**
			 * Keycloak subject (user id)
			 */
			sub: string;
			/**
			 * Platform operator (can provision tenants via /platform).
			 */
			operator: boolean;
		}
		export interface MePermissionsDto {
			canSell: boolean;
			canAccessBackoffice: boolean;
			canManageCatalog: boolean;
			canManageAdherents: boolean;
			canViewReports: boolean;
			canCancelSale: boolean;
			canManageMembers: boolean;
		}
		export interface MeProfileDto {
			/**
			 * Keycloak subject (global user id).
			 */
			sub: string;
			username: string | null;
			roles: ('admin' | 'manager' | 'vendeur' | 'member')[];
			permissions: MePermissionsDto;
		}
		export interface MemberRolesResponseDto {
			userSub: string;
			roles: ('admin' | 'manager' | 'vendeur' | 'member')[];
		}
		export interface MembershipResponseDto {
			id: string; // uuid
			personId: string; // uuid
			academicYearId: string; // uuid
			status: 'active' | 'expired';
			createdAt: string; // date-time
		}
		export interface MyTenantDto {
			tenantId: string; // uuid
			slug: string;
			name: string;
			roles: ('admin' | 'manager' | 'vendeur' | 'member')[];
		}
		export interface OptionGroupResponseDto {
			id: string; // uuid
			productId: string; // uuid
			name: string;
			minSelect: number;
			maxSelect: number;
			position: number;
			options: OptionResponseDto[];
		}
		export interface OptionResponseDto {
			id: string; // uuid
			groupId: string; // uuid
			name: string;
			priceDeltaCents: number;
			position: number;
		}
		export interface PaginatedSalesDto {
			rows: SaleListRowDto[];
			/**
			 * Total rows matching the filter
			 */
			total: number;
			page: number;
			pageSize: number;
		}
		export interface PaymentMethodConfigDto {
			paymentMean: 'CASH' | 'TAP_TO_PAY' | 'CARD_READER';
			provider: 'INTERNAL' | 'SUMUP' | 'STRIPE' | 'HELLOASSO';
			/**
			 * Whether this rail is usable at the POS.
			 */
			enabled: boolean;
			/**
			 * SumUp SDK key for the device; null for rails without one.
			 */
			apiKey: string | null;
		}
		export interface PersonResponseDto {
			id: string; // uuid
			lastName: string;
			firstName: string;
			email: string;
			birthDate: string | null; // date
			/**
			 * True when the person has an active membership in the current year.
			 */
			isMember: boolean;
			memberships: MembershipResponseDto[];
		}
		export interface ProductResponseDto {
			id: string; // uuid
			/**
			 * example:
			 * Bière blonde 25cl
			 */
			name: string;
			stockPolicy: 'tracked' | 'oversell' | 'untracked';
			active: boolean;
			/**
			 * External price in integer cents; null for a variant group.
			 * example:
			 * 250
			 */
			externalPriceCents: number | null;
			/**
			 * Member (adherent) price in integer cents; null for a group.
			 * example:
			 * 200
			 */
			memberPriceCents: number | null;
			/**
			 * True when this product has variants (sold via a panel).
			 */
			hasVariants: boolean;
			/**
			 * Public URL of the product photo, or null when none.
			 */
			imageUrl: string | null;
			/**
			 * Current stock; null when policy is `untracked`.
			 * example:
			 * 42
			 */
			stockQty: number | null;
			createdAt: string; // date-time
		}
		export interface ProductSalesRowDto {
			productId: string; // uuid
			name: string;
			/**
			 * Units sold over the period
			 */
			unitsSold: number;
			/**
			 * Revenue in cents (Σ qty × unit_price_cents)
			 */
			revenueCents: number;
			/**
			 * Distinct sales including this product
			 */
			salesCount: number;
		}
		export interface RefundSaleDto {
			reason?: string;
		}
		export interface ReorderDto {
			items: [ReorderEntryDto, ...ReorderEntryDto[]];
		}
		export interface ReorderEntryDto {
			/**
			 * Grid id, or product id for item reorder.
			 */
			id: string; // uuid
			/**
			 * example:
			 * 0
			 */
			position: number;
		}
		export interface RevenueBucketDto {
			/**
			 * Bucket day, YYYY-MM-DD (UTC)
			 */
			date: string;
			totalCents: number;
			salesCount: number;
			cashCents: number;
			cardCents: number;
		}
		export interface RevenueByMethodDto {
			cash: number;
			card: number;
		}
		export interface RevenueResponseDto {
			/**
			 * Gross revenue of completed sales, in cents
			 */
			totalCents: number;
			salesCount: number;
			byMethod: RevenueByMethodDto;
			/**
			 * Total refunded over the period, in cents
			 */
			refundedCents: number;
		}
		export interface SaleItemResponseDto {
			productId: string; // uuid
			qty: number;
			unitPriceCents: number;
		}
		export interface SaleListRowDto {
			id: string; // uuid
			createdAt: string; // date-time
			totalCents: number;
			paymentMethod: 'cash' | 'card';
			status: 'pending' | 'completed' | 'cancelled';
			/**
			 * actorUsername, or actorUserId as a fallback
			 */
			actor: string;
			/**
			 * Number of line items
			 */
			itemCount: number;
		}
		export interface SaleResponseDto {
			id: string; // uuid
			totalCents: number;
			paymentMethod: 'cash' | 'card';
			paymentMean: 'CASH' | 'TAP_TO_PAY' | 'CARD_READER';
			status: 'pending' | 'completed' | 'cancelled';
			items: SaleItemResponseDto[];
			/**
			 * When a pending card order expires; null otherwise.
			 */
			expiresAt: string | null; // date-time
			createdAt: string; // date-time
		}
		export interface SetStockDto {
			/**
			 * Absolute stock qty
			 * example:
			 * 100
			 */
			qty: number;
		}
		export interface StockResponseDto {
			productId: string; // uuid
			/**
			 * example:
			 * 100
			 */
			qty: number;
		}
		export interface TenantCreatedDto {
			id: string; // uuid
			slug: string;
			name: string;
		}
		export interface UpdateAcademicYearDto {
			label?: string;
			startsOn?: string; // date
			endsOn?: string; // date
			isCurrent?: boolean;
		}
		export interface UpdateGridDto {
			name?: string;
			active?: boolean;
			position?: number;
		}
		export interface UpdateOptionDto {
			name?: string;
			priceDeltaCents?: number;
			position?: number;
		}
		export interface UpdateOptionGroupDto {
			name?: string;
			minSelect?: number;
			maxSelect?: number;
			position?: number;
		}
		export interface UpdatePersonDto {
			lastName?: string;
			firstName?: string;
			email?: string; // email
			birthDate?: string; // date
		}
		export interface UpdateProductDto {
			name?: string;
			/**
			 * External price in cents.
			 */
			externalPriceCents?: number;
			/**
			 * Member (adherent) price in cents.
			 */
			memberPriceCents?: number;
			stockPolicy?: 'tracked' | 'oversell' | 'untracked';
			/**
			 * Archive/unarchive the product.
			 */
			active?: boolean;
		}
		export interface UpsertAppVersionDto {
			appId: 'vente' | 'adherent';
			platform: 'ios' | 'android';
			/**
			 * example:
			 * 426
			 */
			minSupported: number;
			/**
			 * example:
			 * 512
			 */
			latest: number;
		}
		export interface VariantViewDto {
			productId: string; // uuid
			name: string;
			externalPriceCents: number;
			memberPriceCents: number | null;
			stockQty: number | null;
			stockPolicy: 'tracked' | 'oversell' | 'untracked';
			imageUrl: string | null;
		}
	}
}
declare namespace Paths {
	namespace AddGridItem {
		namespace Parameters {
			export type Id = string; // uuid
		}
		export interface PathParameters {
			id: Parameters.Id /* uuid */;
		}
		export type RequestBody = Components.Schemas.AddGridItemDto;
		namespace Responses {
			export type $201 = Components.Schemas.GridViewDto;
			export type $401 = {};
			export type $403 = {};
		}
	}
	namespace AddMembership {
		namespace Parameters {
			export type Id = string; // uuid
		}
		export interface PathParameters {
			id: Parameters.Id /* uuid */;
		}
		export type RequestBody = Components.Schemas.CreateMembershipDto;
		namespace Responses {
			export type $201 = Components.Schemas.PersonResponseDto;
			export type $401 = {};
			export type $403 = {};
		}
	}
	namespace ConfirmOrder {
		namespace Parameters {
			export type Id = string; // uuid
		}
		export interface PathParameters {
			id: Parameters.Id /* uuid */;
		}
		export type RequestBody = Components.Schemas.ConfirmOrderDto;
		namespace Responses {
			export type $201 = Components.Schemas.SaleResponseDto;
			export type $401 = {};
			export type $403 = {};
		}
	}
	namespace Create {
		export type RequestBody = Components.Schemas.CreateTenantDto;
		namespace Responses {
			export type $201 = Components.Schemas.TenantCreatedDto;
			export type $401 = {};
			export type $403 = {};
		}
	}
	namespace CreateAdherent {
		export type RequestBody = Components.Schemas.CreatePersonDto;
		namespace Responses {
			export type $201 = Components.Schemas.PersonResponseDto;
			export type $401 = {};
			export type $403 = {};
		}
	}
	namespace CreateGrid {
		export type RequestBody = Components.Schemas.CreateGridDto;
		namespace Responses {
			export type $201 = Components.Schemas.GridResponseDto;
			export type $401 = {};
			export type $403 = {};
		}
	}
	namespace CreateInviteCode {
		export type RequestBody = Components.Schemas.CreateInviteCodeDto;
		namespace Responses {
			export type $201 = Components.Schemas.InviteCodeCreatedDto;
			export type $401 = {};
			export type $403 = {};
		}
	}
	namespace CreateOption {
		namespace Parameters {
			export type GroupId = string; // uuid
		}
		export interface PathParameters {
			groupId: Parameters.GroupId /* uuid */;
		}
		export type RequestBody = Components.Schemas.CreateOptionDto;
		namespace Responses {
			export type $201 = Components.Schemas.OptionResponseDto;
			export type $401 = {};
			export type $403 = {};
		}
	}
	namespace CreateOptionGroup {
		namespace Parameters {
			export type Id = string; // uuid
		}
		export interface PathParameters {
			id: Parameters.Id /* uuid */;
		}
		export type RequestBody = Components.Schemas.CreateOptionGroupDto;
		namespace Responses {
			export type $201 = Components.Schemas.OptionGroupResponseDto;
			export type $401 = {};
			export type $403 = {};
		}
	}
	namespace CreateOrder {
		export type RequestBody = Components.Schemas.CreateOrderDto;
		namespace Responses {
			export type $201 = Components.Schemas.SaleResponseDto;
			export type $401 = {};
			export type $403 = {};
		}
	}
	namespace CreateProduct {
		export type RequestBody = Components.Schemas.CreateProductDto;
		namespace Responses {
			export type $201 = Components.Schemas.ProductResponseDto;
			export type $401 = {};
			export type $403 = {};
		}
	}
	namespace CreateVariant {
		namespace Parameters {
			export type Id = string; // uuid
		}
		export interface PathParameters {
			id: Parameters.Id /* uuid */;
		}
		export type RequestBody = Components.Schemas.CreateProductDto;
		namespace Responses {
			export type $201 = Components.Schemas.ProductResponseDto;
			export type $401 = {};
			export type $403 = {};
		}
	}
	namespace CreateYear {
		export type RequestBody = Components.Schemas.CreateAcademicYearDto;
		namespace Responses {
			export type $201 = Components.Schemas.AcademicYearResponseDto;
			export type $401 = {};
			export type $403 = {};
		}
	}
	namespace DeclineOrder {
		namespace Parameters {
			export type Id = string; // uuid
		}
		export interface PathParameters {
			id: Parameters.Id /* uuid */;
		}
		namespace Responses {
			export type $201 = Components.Schemas.SaleResponseDto;
			export type $401 = {};
			export type $403 = {};
		}
	}
	namespace DeleteOption {
		namespace Parameters {
			export type OptionId = string; // uuid
		}
		export interface PathParameters {
			optionId: Parameters.OptionId /* uuid */;
		}
		namespace Responses {
			export type $204 = {};
			export type $401 = {};
			export type $403 = {};
		}
	}
	namespace DeleteOptionGroup {
		namespace Parameters {
			export type GroupId = string; // uuid
		}
		export interface PathParameters {
			groupId: Parameters.GroupId /* uuid */;
		}
		namespace Responses {
			export type $204 = {};
			export type $401 = {};
			export type $403 = {};
		}
	}
	namespace DeleteProduct {
		namespace Parameters {
			export type Id = string; // uuid
		}
		export interface PathParameters {
			id: Parameters.Id /* uuid */;
		}
		namespace Responses {
			export type $204 = {};
			export type $401 = {};
			export type $403 = {};
		}
	}
	namespace DeleteProductImage {
		namespace Parameters {
			export type Id = string; // uuid
		}
		export interface PathParameters {
			id: Parameters.Id /* uuid */;
		}
		namespace Responses {
			export type $204 = {};
			export type $401 = {};
			export type $403 = {};
		}
	}
	namespace ExpireMembership {
		namespace Parameters {
			export type Id = string; // uuid
			export type MembershipId = string; // uuid
		}
		export interface PathParameters {
			id: Parameters.Id /* uuid */;
			membershipId: Parameters.MembershipId /* uuid */;
		}
		namespace Responses {
			export type $201 = Components.Schemas.PersonResponseDto;
			export type $401 = {};
			export type $403 = {};
		}
	}
	namespace ExportCsv {
		namespace Parameters {
			export type From = string;
			export type To = string;
		}
		export interface QueryParameters {
			from?: Parameters.From;
			to?: Parameters.To;
		}
		namespace Responses {
			export type $200 = string;
			export type $401 = {};
			export type $403 = {};
		}
	}
	namespace GetAdherent {
		namespace Parameters {
			export type Id = string; // uuid
		}
		export interface PathParameters {
			id: Parameters.Id /* uuid */;
		}
		namespace Responses {
			export type $200 = Components.Schemas.PersonResponseDto;
			export type $401 = {};
			export type $403 = {};
		}
	}
	namespace GetGrid {
		namespace Parameters {
			export type Id = string; // uuid
		}
		export interface PathParameters {
			id: Parameters.Id /* uuid */;
		}
		namespace Responses {
			export type $200 = Components.Schemas.GridViewDto;
			export type $401 = {};
			export type $403 = {};
		}
	}
	namespace GetProduct {
		namespace Parameters {
			export type Id = string; // uuid
		}
		export interface PathParameters {
			id: Parameters.Id /* uuid */;
		}
		namespace Responses {
			export type $200 = Components.Schemas.ProductResponseDto;
			export type $401 = {};
			export type $403 = {};
		}
	}
	namespace GetProductStock {
		namespace Parameters {
			export type Id = string; // uuid
		}
		export interface PathParameters {
			id: Parameters.Id /* uuid */;
		}
		namespace Responses {
			export type $200 = Components.Schemas.StockResponseDto;
			export type $401 = {};
			export type $403 = {};
		}
	}
	namespace GetSale {
		namespace Parameters {
			export type Id = string; // uuid
		}
		export interface PathParameters {
			id: Parameters.Id /* uuid */;
		}
		namespace Responses {
			export type $200 = Components.Schemas.SaleResponseDto;
			export type $401 = {};
			export type $403 = {};
		}
	}
	namespace Grant {
		namespace Parameters {
			export type Role = 'admin' | 'manager' | 'vendeur' | 'member';
			export type UserSub = string;
		}
		export interface PathParameters {
			userSub: Parameters.UserSub;
			role: Parameters.Role;
		}
		namespace Responses {
			export type $200 = Components.Schemas.MemberRolesResponseDto;
			export type $401 = {};
			export type $403 = {};
		}
	}
	namespace Join {
		export type RequestBody = Components.Schemas.JoinTenantDto;
		namespace Responses {
			export type $201 = Components.Schemas.JoinResultDto;
			export type $401 = {};
		}
	}
	namespace List {
		namespace Responses {
			export type $200 = Components.Schemas.PaymentMethodConfigDto[];
			export type $401 = {};
			export type $403 = {};
		}
	}
	namespace ListAdherents {
		namespace Parameters {
			export type Q = string;
		}
		export interface QueryParameters {
			q?: Parameters.Q;
		}
		namespace Responses {
			export type $200 = Components.Schemas.PersonResponseDto[];
			export type $401 = {};
			export type $403 = {};
		}
	}
	namespace ListGrids {
		namespace Responses {
			export type $200 = Components.Schemas.GridResponseDto[];
			export type $401 = {};
			export type $403 = {};
		}
	}
	namespace ListInviteCodes {
		namespace Responses {
			export type $200 = Components.Schemas.InviteCodeDto[];
			export type $401 = {};
			export type $403 = {};
		}
	}
	namespace ListMembers {
		namespace Responses {
			export type $200 = Components.Schemas.MemberRolesResponseDto[];
			export type $401 = {};
			export type $403 = {};
		}
	}
	namespace ListOptionGroups {
		namespace Parameters {
			export type Id = string; // uuid
		}
		export interface PathParameters {
			id: Parameters.Id /* uuid */;
		}
		namespace Responses {
			export type $200 = Components.Schemas.OptionGroupResponseDto[];
			export type $401 = {};
			export type $403 = {};
		}
	}
	namespace ListProducts {
		namespace Responses {
			export type $200 = Components.Schemas.ProductResponseDto[];
			export type $401 = {};
			export type $403 = {};
		}
	}
	namespace ListRoles {
		namespace Parameters {
			export type UserSub = string;
		}
		export interface PathParameters {
			userSub: Parameters.UserSub;
		}
		namespace Responses {
			export type $200 = Components.Schemas.MemberRolesResponseDto;
			export type $401 = {};
			export type $403 = {};
		}
	}
	namespace ListSales {
		namespace Parameters {
			export type From = string;
			export type Method = 'cash' | 'card';
			export type Page = number;
			export type PageSize = number;
			export type Status = 'pending' | 'completed' | 'cancelled';
			export type To = string;
		}
		export interface QueryParameters {
			from?: Parameters.From;
			to?: Parameters.To;
			method?: Parameters.Method;
			status?: Parameters.Status;
			page?: Parameters.Page;
			pageSize?: Parameters.PageSize;
		}
		namespace Responses {
			export type $200 = Components.Schemas.PaginatedSalesDto;
			export type $401 = {};
			export type $403 = {};
		}
	}
	namespace ListVariants {
		namespace Parameters {
			export type Id = string; // uuid
		}
		export interface PathParameters {
			id: Parameters.Id /* uuid */;
		}
		namespace Responses {
			export type $200 = Components.Schemas.ProductResponseDto[];
			export type $401 = {};
			export type $403 = {};
		}
	}
	namespace ListYears {
		namespace Responses {
			export type $200 = Components.Schemas.AcademicYearResponseDto[];
			export type $401 = {};
			export type $403 = {};
		}
	}
	namespace Me {
		namespace Responses {
			export type $200 = Components.Schemas.MeDto;
			export type $401 = {};
		}
	}
	namespace MySales {
		namespace Responses {
			export type $200 = Components.Schemas.SaleResponseDto[];
			export type $401 = {};
			export type $403 = {};
		}
	}
	namespace MyTenants {
		namespace Responses {
			export type $200 = Components.Schemas.MyTenantDto[];
			export type $401 = {};
		}
	}
	namespace ProductImage {
		namespace Parameters {
			export type Id = string;
			export type TenantId = string; // uuid
		}
		export interface PathParameters {
			tenantId: Parameters.TenantId /* uuid */;
			id: Parameters.Id;
		}
		namespace Responses {
			export type $200 = {};
		}
	}
	namespace Profile {
		namespace Responses {
			export type $200 = Components.Schemas.MeProfileDto;
			export type $401 = {};
			export type $403 = {};
		}
	}
	namespace ReconcileOrders {
		namespace Responses {
			export type $201 = {};
			export type $401 = {};
			export type $403 = {};
		}
	}
	namespace Refund {
		namespace Parameters {
			export type Id = string; // uuid
		}
		export interface PathParameters {
			id: Parameters.Id /* uuid */;
		}
		export type RequestBody = Components.Schemas.RefundSaleDto;
		namespace Responses {
			export type $201 = Components.Schemas.SaleResponseDto;
			export type $401 = {};
			export type $403 = {};
		}
	}
	namespace RemoveAdherent {
		namespace Parameters {
			export type Id = string; // uuid
		}
		export interface PathParameters {
			id: Parameters.Id /* uuid */;
		}
		namespace Responses {
			export type $204 = {};
			export type $401 = {};
			export type $403 = {};
		}
	}
	namespace RemoveGrid {
		namespace Parameters {
			export type Id = string; // uuid
		}
		export interface PathParameters {
			id: Parameters.Id /* uuid */;
		}
		namespace Responses {
			export type $204 = {};
			export type $401 = {};
			export type $403 = {};
		}
	}
	namespace RemoveGridItem {
		namespace Parameters {
			export type Id = string; // uuid
			export type ProductId = string; // uuid
		}
		export interface PathParameters {
			id: Parameters.Id /* uuid */;
			productId: Parameters.ProductId /* uuid */;
		}
		namespace Responses {
			export type $204 = {};
			export type $401 = {};
			export type $403 = {};
		}
	}
	namespace ReorderGridItems {
		namespace Parameters {
			export type Id = string; // uuid
		}
		export interface PathParameters {
			id: Parameters.Id /* uuid */;
		}
		export type RequestBody = Components.Schemas.ReorderDto;
		namespace Responses {
			export type $200 = Components.Schemas.GridViewDto;
			export type $401 = {};
			export type $403 = {};
		}
	}
	namespace ReorderGrids {
		export type RequestBody = Components.Schemas.ReorderDto;
		namespace Responses {
			export type $204 = {};
			export type $401 = {};
			export type $403 = {};
		}
	}
	namespace Revenue {
		namespace Parameters {
			export type From = string;
			export type To = string;
		}
		export interface QueryParameters {
			from?: Parameters.From;
			to?: Parameters.To;
		}
		namespace Responses {
			export type $200 = Components.Schemas.RevenueResponseDto;
			export type $401 = {};
			export type $403 = {};
		}
	}
	namespace RevenueTimeseries {
		namespace Parameters {
			export type From = string;
			export type To = string;
		}
		export interface QueryParameters {
			from?: Parameters.From;
			to?: Parameters.To;
		}
		namespace Responses {
			export type $200 = Components.Schemas.RevenueBucketDto[];
			export type $401 = {};
			export type $403 = {};
		}
	}
	namespace Revoke {
		namespace Parameters {
			export type Role = 'admin' | 'manager' | 'vendeur' | 'member';
			export type UserSub = string;
		}
		export interface PathParameters {
			userSub: Parameters.UserSub;
			role: Parameters.Role;
		}
		namespace Responses {
			export type $200 = Components.Schemas.MemberRolesResponseDto;
			export type $401 = {};
			export type $403 = {};
		}
	}
	namespace RevokeInviteCode {
		namespace Parameters {
			export type CodeId = string; // uuid ^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$
		}
		export interface PathParameters {
			codeId: Parameters.CodeId /* uuid ^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$ */;
		}
		namespace Responses {
			export type $200 = {};
			export type $401 = {};
			export type $403 = {};
		}
	}
	namespace SalesByProduct {
		namespace Parameters {
			export type From = string;
			export type To = string;
		}
		export interface QueryParameters {
			from?: Parameters.From;
			to?: Parameters.To;
		}
		namespace Responses {
			export type $200 = Components.Schemas.ProductSalesRowDto[];
			export type $401 = {};
			export type $403 = {};
		}
	}
	namespace SearchAdherents {
		namespace Parameters {
			export type Q = string;
		}
		export interface QueryParameters {
			q?: Parameters.Q;
		}
		namespace Responses {
			export type $200 = Components.Schemas.AdherentSearchResultDto[];
			export type $401 = {};
			export type $403 = {};
		}
	}
	namespace SetAppVersion {
		export type RequestBody = Components.Schemas.UpsertAppVersionDto;
		namespace Responses {
			export type $200 = Components.Schemas.UpsertAppVersionDto;
			export type $401 = {};
			export type $403 = {};
		}
	}
	namespace SetProductImage {
		namespace Parameters {
			export type Id = string; // uuid
		}
		export interface PathParameters {
			id: Parameters.Id /* uuid */;
		}
		namespace Responses {
			export type $200 = Components.Schemas.ProductResponseDto;
			export type $401 = {};
			export type $403 = {};
		}
	}
	namespace SetProductStock {
		namespace Parameters {
			export type Id = string; // uuid
		}
		export interface PathParameters {
			id: Parameters.Id /* uuid */;
		}
		export type RequestBody = Components.Schemas.SetStockDto;
		namespace Responses {
			export type $200 = Components.Schemas.StockResponseDto;
			export type $401 = {};
			export type $403 = {};
		}
	}
	namespace UpdateAdherent {
		namespace Parameters {
			export type Id = string; // uuid
		}
		export interface PathParameters {
			id: Parameters.Id /* uuid */;
		}
		export type RequestBody = Components.Schemas.UpdatePersonDto;
		namespace Responses {
			export type $200 = Components.Schemas.PersonResponseDto;
			export type $401 = {};
			export type $403 = {};
		}
	}
	namespace UpdateGrid {
		namespace Parameters {
			export type Id = string; // uuid
		}
		export interface PathParameters {
			id: Parameters.Id /* uuid */;
		}
		export type RequestBody = Components.Schemas.UpdateGridDto;
		namespace Responses {
			export type $200 = Components.Schemas.GridResponseDto;
			export type $401 = {};
			export type $403 = {};
		}
	}
	namespace UpdateOption {
		namespace Parameters {
			export type OptionId = string; // uuid
		}
		export interface PathParameters {
			optionId: Parameters.OptionId /* uuid */;
		}
		export type RequestBody = Components.Schemas.UpdateOptionDto;
		namespace Responses {
			export type $200 = Components.Schemas.OptionResponseDto;
			export type $401 = {};
			export type $403 = {};
		}
	}
	namespace UpdateOptionGroup {
		namespace Parameters {
			export type GroupId = string; // uuid
		}
		export interface PathParameters {
			groupId: Parameters.GroupId /* uuid */;
		}
		export type RequestBody = Components.Schemas.UpdateOptionGroupDto;
		namespace Responses {
			export type $200 = Components.Schemas.OptionGroupResponseDto;
			export type $401 = {};
			export type $403 = {};
		}
	}
	namespace UpdateProduct {
		namespace Parameters {
			export type Id = string; // uuid
		}
		export interface PathParameters {
			id: Parameters.Id /* uuid */;
		}
		export type RequestBody = Components.Schemas.UpdateProductDto;
		namespace Responses {
			export type $200 = Components.Schemas.ProductResponseDto;
			export type $401 = {};
			export type $403 = {};
		}
	}
	namespace UpdateYear {
		namespace Parameters {
			export type YearId = string; // uuid
		}
		export interface PathParameters {
			yearId: Parameters.YearId /* uuid */;
		}
		export type RequestBody = Components.Schemas.UpdateAcademicYearDto;
		namespace Responses {
			export type $200 = Components.Schemas.AcademicYearResponseDto;
			export type $401 = {};
			export type $403 = {};
		}
	}
}

export interface OperationMethods {
	/**
	 * join - Join a tenant with an invite code (D40)
	 */
	join(
		parameters?: Parameters<UnknownParamsObject> | null,
		data?: Paths.Join.RequestBody,
		config?: AxiosRequestConfig,
	): OperationResponse<Paths.Join.Responses.$201>;
	/**
	 * me - Current user: identity + platform-operator capability
	 */
	me(
		parameters?: Parameters<UnknownParamsObject> | null,
		data?: any,
		config?: AxiosRequestConfig,
	): OperationResponse<Paths.Me.Responses.$200>;
	/**
	 * myTenants - List the tenants I belong to (with my roles)
	 */
	myTenants(
		parameters?: Parameters<UnknownParamsObject> | null,
		data?: any,
		config?: AxiosRequestConfig,
	): OperationResponse<Paths.MyTenants.Responses.$200>;
	/**
	 * listProducts - List products (active only unless the caller manages catalogue)
	 */
	listProducts(
		parameters?: Parameters<UnknownParamsObject> | null,
		data?: any,
		config?: AxiosRequestConfig,
	): OperationResponse<Paths.ListProducts.Responses.$200>;
	/**
	 * createProduct - Create a product (external + member price + stock)
	 */
	createProduct(
		parameters?: Parameters<UnknownParamsObject> | null,
		data?: Paths.CreateProduct.RequestBody,
		config?: AxiosRequestConfig,
	): OperationResponse<Paths.CreateProduct.Responses.$201>;
	/**
	 * getProduct - Get a product
	 */
	getProduct(
		parameters?: Parameters<Paths.GetProduct.PathParameters> | null,
		data?: any,
		config?: AxiosRequestConfig,
	): OperationResponse<Paths.GetProduct.Responses.$200>;
	/**
	 * updateProduct - Update a product
	 */
	updateProduct(
		parameters?: Parameters<Paths.UpdateProduct.PathParameters> | null,
		data?: Paths.UpdateProduct.RequestBody,
		config?: AxiosRequestConfig,
	): OperationResponse<Paths.UpdateProduct.Responses.$200>;
	/**
	 * deleteProduct - Archive a product (soft delete — preserves sale history)
	 */
	deleteProduct(
		parameters?: Parameters<Paths.DeleteProduct.PathParameters> | null,
		data?: any,
		config?: AxiosRequestConfig,
	): OperationResponse<Paths.DeleteProduct.Responses.$204>;
	/**
	 * listVariants - List a product’s variants
	 */
	listVariants(
		parameters?: Parameters<Paths.ListVariants.PathParameters> | null,
		data?: any,
		config?: AxiosRequestConfig,
	): OperationResponse<Paths.ListVariants.Responses.$200>;
	/**
	 * createVariant - Create a variant (sub-product) under a product
	 */
	createVariant(
		parameters?: Parameters<Paths.CreateVariant.PathParameters> | null,
		data?: Paths.CreateVariant.RequestBody,
		config?: AxiosRequestConfig,
	): OperationResponse<Paths.CreateVariant.Responses.$201>;
	/**
	 * setProductImage - Upload or replace a product photo (jpeg/png/webp, ≤ 512 KB)
	 */
	setProductImage(
		parameters?: Parameters<Paths.SetProductImage.PathParameters> | null,
		data?: any,
		config?: AxiosRequestConfig,
	): OperationResponse<Paths.SetProductImage.Responses.$200>;
	/**
	 * deleteProductImage - Delete a product photo
	 */
	deleteProductImage(
		parameters?: Parameters<Paths.DeleteProductImage.PathParameters> | null,
		data?: any,
		config?: AxiosRequestConfig,
	): OperationResponse<Paths.DeleteProductImage.Responses.$204>;
	/**
	 * getProductStock - Get product stock
	 */
	getProductStock(
		parameters?: Parameters<Paths.GetProductStock.PathParameters> | null,
		data?: any,
		config?: AxiosRequestConfig,
	): OperationResponse<Paths.GetProductStock.Responses.$200>;
	/**
	 * setProductStock - Set absolute product stock
	 */
	setProductStock(
		parameters?: Parameters<Paths.SetProductStock.PathParameters> | null,
		data?: Paths.SetProductStock.RequestBody,
		config?: AxiosRequestConfig,
	): OperationResponse<Paths.SetProductStock.Responses.$200>;
	/**
	 * listOptionGroups - List a product’s option groups
	 */
	listOptionGroups(
		parameters?: Parameters<Paths.ListOptionGroups.PathParameters> | null,
		data?: any,
		config?: AxiosRequestConfig,
	): OperationResponse<Paths.ListOptionGroups.Responses.$200>;
	/**
	 * createOptionGroup - Create an option group on a product
	 */
	createOptionGroup(
		parameters?: Parameters<Paths.CreateOptionGroup.PathParameters> | null,
		data?: Paths.CreateOptionGroup.RequestBody,
		config?: AxiosRequestConfig,
	): OperationResponse<Paths.CreateOptionGroup.Responses.$201>;
	/**
	 * updateOptionGroup - Update an option group
	 */
	updateOptionGroup(
		parameters?: Parameters<Paths.UpdateOptionGroup.PathParameters> | null,
		data?: Paths.UpdateOptionGroup.RequestBody,
		config?: AxiosRequestConfig,
	): OperationResponse<Paths.UpdateOptionGroup.Responses.$200>;
	/**
	 * deleteOptionGroup - Delete an option group (and its options)
	 */
	deleteOptionGroup(
		parameters?: Parameters<Paths.DeleteOptionGroup.PathParameters> | null,
		data?: any,
		config?: AxiosRequestConfig,
	): OperationResponse<Paths.DeleteOptionGroup.Responses.$204>;
	/**
	 * createOption - Add an option to a group
	 */
	createOption(
		parameters?: Parameters<Paths.CreateOption.PathParameters> | null,
		data?: Paths.CreateOption.RequestBody,
		config?: AxiosRequestConfig,
	): OperationResponse<Paths.CreateOption.Responses.$201>;
	/**
	 * updateOption - Update an option
	 */
	updateOption(
		parameters?: Parameters<Paths.UpdateOption.PathParameters> | null,
		data?: Paths.UpdateOption.RequestBody,
		config?: AxiosRequestConfig,
	): OperationResponse<Paths.UpdateOption.Responses.$200>;
	/**
	 * deleteOption - Delete an option
	 */
	deleteOption(
		parameters?: Parameters<Paths.DeleteOption.PathParameters> | null,
		data?: any,
		config?: AxiosRequestConfig,
	): OperationResponse<Paths.DeleteOption.Responses.$204>;
	/**
	 * listGrids - List grids (active only unless the caller manages catalogue)
	 */
	listGrids(
		parameters?: Parameters<UnknownParamsObject> | null,
		data?: any,
		config?: AxiosRequestConfig,
	): OperationResponse<Paths.ListGrids.Responses.$200>;
	/**
	 * createGrid - Create a grid
	 */
	createGrid(
		parameters?: Parameters<UnknownParamsObject> | null,
		data?: Paths.CreateGrid.RequestBody,
		config?: AxiosRequestConfig,
	): OperationResponse<Paths.CreateGrid.Responses.$201>;
	/**
	 * reorderGrids - Reorder grids (drag-and-drop)
	 */
	reorderGrids(
		parameters?: Parameters<UnknownParamsObject> | null,
		data?: Paths.ReorderGrids.RequestBody,
		config?: AxiosRequestConfig,
	): OperationResponse<Paths.ReorderGrids.Responses.$204>;
	/**
	 * getGrid - Get a grid with products + prices + stock
	 */
	getGrid(
		parameters?: Parameters<Paths.GetGrid.PathParameters> | null,
		data?: any,
		config?: AxiosRequestConfig,
	): OperationResponse<Paths.GetGrid.Responses.$200>;
	/**
	 * updateGrid - Update a grid
	 */
	updateGrid(
		parameters?: Parameters<Paths.UpdateGrid.PathParameters> | null,
		data?: Paths.UpdateGrid.RequestBody,
		config?: AxiosRequestConfig,
	): OperationResponse<Paths.UpdateGrid.Responses.$200>;
	/**
	 * removeGrid - Delete a grid
	 */
	removeGrid(
		parameters?: Parameters<Paths.RemoveGrid.PathParameters> | null,
		data?: any,
		config?: AxiosRequestConfig,
	): OperationResponse<Paths.RemoveGrid.Responses.$204>;
	/**
	 * addGridItem - Add a product to a grid
	 */
	addGridItem(
		parameters?: Parameters<Paths.AddGridItem.PathParameters> | null,
		data?: Paths.AddGridItem.RequestBody,
		config?: AxiosRequestConfig,
	): OperationResponse<Paths.AddGridItem.Responses.$201>;
	/**
	 * reorderGridItems - Reorder a grid’s items (drag-and-drop)
	 */
	reorderGridItems(
		parameters?: Parameters<Paths.ReorderGridItems.PathParameters> | null,
		data?: Paths.ReorderGridItems.RequestBody,
		config?: AxiosRequestConfig,
	): OperationResponse<Paths.ReorderGridItems.Responses.$200>;
	/**
	 * removeGridItem - Remove a product from a grid
	 */
	removeGridItem(
		parameters?: Parameters<Paths.RemoveGridItem.PathParameters> | null,
		data?: any,
		config?: AxiosRequestConfig,
	): OperationResponse<Paths.RemoveGridItem.Responses.$204>;
	/**
	 * createOrder - Create an order — cash finalizes; a card mean opens it pending
	 */
	createOrder(
		parameters?: Parameters<UnknownParamsObject> | null,
		data?: Paths.CreateOrder.RequestBody,
		config?: AxiosRequestConfig,
	): OperationResponse<Paths.CreateOrder.Responses.$201>;
	/**
	 * reconcileOrders - Reconcile pending card orders against SumUp (D24)
	 */
	reconcileOrders(
		parameters?: Parameters<UnknownParamsObject> | null,
		data?: any,
		config?: AxiosRequestConfig,
	): OperationResponse<Paths.ReconcileOrders.Responses.$201>;
	/**
	 * confirmOrder - Confirm a card order → finalize the sale
	 */
	confirmOrder(
		parameters?: Parameters<Paths.ConfirmOrder.PathParameters> | null,
		data?: Paths.ConfirmOrder.RequestBody,
		config?: AxiosRequestConfig,
	): OperationResponse<Paths.ConfirmOrder.Responses.$201>;
	/**
	 * declineOrder - Decline a card order — payment refused → order cancelled
	 */
	declineOrder(
		parameters?: Parameters<Paths.DeclineOrder.PathParameters> | null,
		data?: any,
		config?: AxiosRequestConfig,
	): OperationResponse<Paths.DeclineOrder.Responses.$201>;
	/**
	 * refund - Cancel / refund a completed sale (D12)
	 */
	refund(
		parameters?: Parameters<Paths.Refund.PathParameters> | null,
		data?: Paths.Refund.RequestBody,
		config?: AxiosRequestConfig,
	): OperationResponse<Paths.Refund.Responses.$201>;
	/**
	 * listSales - List sales (paginated, filterable)
	 */
	listSales(
		parameters?: Parameters<Paths.ListSales.QueryParameters> | null,
		data?: any,
		config?: AxiosRequestConfig,
	): OperationResponse<Paths.ListSales.Responses.$200>;
	/**
	 * getSale - Get a sale with its line items
	 */
	getSale(
		parameters?: Parameters<Paths.GetSale.PathParameters> | null,
		data?: any,
		config?: AxiosRequestConfig,
	): OperationResponse<Paths.GetSale.Responses.$200>;
	/**
	 * revenue - Revenue (CA) by payment method over a period
	 */
	revenue(
		parameters?: Parameters<Paths.Revenue.QueryParameters> | null,
		data?: any,
		config?: AxiosRequestConfig,
	): OperationResponse<Paths.Revenue.Responses.$200>;
	/**
	 * salesByProduct - Sales aggregated by product (best-sellers)
	 */
	salesByProduct(
		parameters?: Parameters<Paths.SalesByProduct.QueryParameters> | null,
		data?: any,
		config?: AxiosRequestConfig,
	): OperationResponse<Paths.SalesByProduct.Responses.$200>;
	/**
	 * revenueTimeseries - Daily revenue time-series for the dashboard
	 */
	revenueTimeseries(
		parameters?: Parameters<Paths.RevenueTimeseries.QueryParameters> | null,
		data?: any,
		config?: AxiosRequestConfig,
	): OperationResponse<Paths.RevenueTimeseries.Responses.$200>;
	/**
	 * exportCsv - Export sales as CSV (trésorier)
	 */
	exportCsv(
		parameters?: Parameters<Paths.ExportCsv.QueryParameters> | null,
		data?: any,
		config?: AxiosRequestConfig,
	): OperationResponse<Paths.ExportCsv.Responses.$200>;
	/**
	 * searchAdherents - Search adherents (to attach member pricing)
	 */
	searchAdherents(
		parameters?: Parameters<Paths.SearchAdherents.QueryParameters> | null,
		data?: any,
		config?: AxiosRequestConfig,
	): OperationResponse<Paths.SearchAdherents.Responses.$200>;
	/**
	 * listAdherents - List/search adherents (full registry)
	 */
	listAdherents(
		parameters?: Parameters<Paths.ListAdherents.QueryParameters> | null,
		data?: any,
		config?: AxiosRequestConfig,
	): OperationResponse<Paths.ListAdherents.Responses.$200>;
	/**
	 * createAdherent - Register an adherent
	 */
	createAdherent(
		parameters?: Parameters<UnknownParamsObject> | null,
		data?: Paths.CreateAdherent.RequestBody,
		config?: AxiosRequestConfig,
	): OperationResponse<Paths.CreateAdherent.Responses.$201>;
	/**
	 * getAdherent - Get an adherent
	 */
	getAdherent(
		parameters?: Parameters<Paths.GetAdherent.PathParameters> | null,
		data?: any,
		config?: AxiosRequestConfig,
	): OperationResponse<Paths.GetAdherent.Responses.$200>;
	/**
	 * updateAdherent - Update an adherent
	 */
	updateAdherent(
		parameters?: Parameters<Paths.UpdateAdherent.PathParameters> | null,
		data?: Paths.UpdateAdherent.RequestBody,
		config?: AxiosRequestConfig,
	): OperationResponse<Paths.UpdateAdherent.Responses.$200>;
	/**
	 * removeAdherent - Delete an adherent
	 */
	removeAdherent(
		parameters?: Parameters<Paths.RemoveAdherent.PathParameters> | null,
		data?: any,
		config?: AxiosRequestConfig,
	): OperationResponse<Paths.RemoveAdherent.Responses.$204>;
	/**
	 * addMembership - Add a membership to an adherent
	 */
	addMembership(
		parameters?: Parameters<Paths.AddMembership.PathParameters> | null,
		data?: Paths.AddMembership.RequestBody,
		config?: AxiosRequestConfig,
	): OperationResponse<Paths.AddMembership.Responses.$201>;
	/**
	 * expireMembership - Expire a membership
	 */
	expireMembership(
		parameters?: Parameters<Paths.ExpireMembership.PathParameters> | null,
		data?: any,
		config?: AxiosRequestConfig,
	): OperationResponse<Paths.ExpireMembership.Responses.$201>;
	/**
	 * listYears - List academic years
	 */
	listYears(
		parameters?: Parameters<UnknownParamsObject> | null,
		data?: any,
		config?: AxiosRequestConfig,
	): OperationResponse<Paths.ListYears.Responses.$200>;
	/**
	 * createYear - Create an academic year
	 */
	createYear(
		parameters?: Parameters<UnknownParamsObject> | null,
		data?: Paths.CreateYear.RequestBody,
		config?: AxiosRequestConfig,
	): OperationResponse<Paths.CreateYear.Responses.$201>;
	/**
	 * updateYear - Update an academic year (e.g. set current)
	 */
	updateYear(
		parameters?: Parameters<Paths.UpdateYear.PathParameters> | null,
		data?: Paths.UpdateYear.RequestBody,
		config?: AxiosRequestConfig,
	): OperationResponse<Paths.UpdateYear.Responses.$200>;
	/**
	 * listMembers - List tenant members with their roles
	 */
	listMembers(
		parameters?: Parameters<UnknownParamsObject> | null,
		data?: any,
		config?: AxiosRequestConfig,
	): OperationResponse<Paths.ListMembers.Responses.$200>;
	/**
	 * listRoles - List a member's roles
	 */
	listRoles(
		parameters?: Parameters<Paths.ListRoles.PathParameters> | null,
		data?: any,
		config?: AxiosRequestConfig,
	): OperationResponse<Paths.ListRoles.Responses.$200>;
	/**
	 * grant - Grant a role to a member (idempotent)
	 */
	grant(
		parameters?: Parameters<Paths.Grant.PathParameters> | null,
		data?: any,
		config?: AxiosRequestConfig,
	): OperationResponse<Paths.Grant.Responses.$200>;
	/**
	 * revoke - Revoke a role from a member (idempotent)
	 */
	revoke(
		parameters?: Parameters<Paths.Revoke.PathParameters> | null,
		data?: any,
		config?: AxiosRequestConfig,
	): OperationResponse<Paths.Revoke.Responses.$200>;
	/**
	 * listInviteCodes - List invite codes (no raw code)
	 */
	listInviteCodes(
		parameters?: Parameters<UnknownParamsObject> | null,
		data?: any,
		config?: AxiosRequestConfig,
	): OperationResponse<Paths.ListInviteCodes.Responses.$200>;
	/**
	 * createInviteCode - Create an invite code (raw code shown once)
	 */
	createInviteCode(
		parameters?: Parameters<UnknownParamsObject> | null,
		data?: Paths.CreateInviteCode.RequestBody,
		config?: AxiosRequestConfig,
	): OperationResponse<Paths.CreateInviteCode.Responses.$201>;
	/**
	 * revokeInviteCode - Revoke an invite code
	 */
	revokeInviteCode(
		parameters?: Parameters<Paths.RevokeInviteCode.PathParameters> | null,
		data?: any,
		config?: AxiosRequestConfig,
	): OperationResponse<Paths.RevokeInviteCode.Responses.$200>;
	/**
	 * setAppVersion - Set the tenant's app-version policy
	 */
	setAppVersion(
		parameters?: Parameters<UnknownParamsObject> | null,
		data?: Paths.SetAppVersion.RequestBody,
		config?: AxiosRequestConfig,
	): OperationResponse<Paths.SetAppVersion.Responses.$200>;
	/**
	 * list - Enabled payment means for this tenant (POS), with SumUp keys
	 */
	list(
		parameters?: Parameters<UnknownParamsObject> | null,
		data?: any,
		config?: AxiosRequestConfig,
	): OperationResponse<Paths.List.Responses.$200>;
	/**
	 * profile - Current user on this tenant: roles + permissions
	 */
	profile(
		parameters?: Parameters<UnknownParamsObject> | null,
		data?: any,
		config?: AxiosRequestConfig,
	): OperationResponse<Paths.Profile.Responses.$200>;
	/**
	 * mySales - The current vendeur's own sales (all statuses, newest first)
	 */
	mySales(
		parameters?: Parameters<UnknownParamsObject> | null,
		data?: any,
		config?: AxiosRequestConfig,
	): OperationResponse<Paths.MySales.Responses.$200>;
	/**
	 * productImage - Get a product photo (public, cacheable)
	 */
	productImage(
		parameters?: Parameters<Paths.ProductImage.PathParameters> | null,
		data?: any,
		config?: AxiosRequestConfig,
	): OperationResponse<Paths.ProductImage.Responses.$200>;
	/**
	 * create - Create a tenant (registry + first admin tuple)
	 */
	create(
		parameters?: Parameters<UnknownParamsObject> | null,
		data?: Paths.Create.RequestBody,
		config?: AxiosRequestConfig,
	): OperationResponse<Paths.Create.Responses.$201>;
}

export interface PathsDictionary {
	['/tenants/join']: {
		/**
		 * join - Join a tenant with an invite code (D40)
		 */
		post(
			parameters?: Parameters<UnknownParamsObject> | null,
			data?: Paths.Join.RequestBody,
			config?: AxiosRequestConfig,
		): OperationResponse<Paths.Join.Responses.$201>;
	};
	['/me']: {
		/**
		 * me - Current user: identity + platform-operator capability
		 */
		get(
			parameters?: Parameters<UnknownParamsObject> | null,
			data?: any,
			config?: AxiosRequestConfig,
		): OperationResponse<Paths.Me.Responses.$200>;
	};
	['/me/tenants']: {
		/**
		 * myTenants - List the tenants I belong to (with my roles)
		 */
		get(
			parameters?: Parameters<UnknownParamsObject> | null,
			data?: any,
			config?: AxiosRequestConfig,
		): OperationResponse<Paths.MyTenants.Responses.$200>;
	};
	['/products']: {
		/**
		 * listProducts - List products (active only unless the caller manages catalogue)
		 */
		get(
			parameters?: Parameters<UnknownParamsObject> | null,
			data?: any,
			config?: AxiosRequestConfig,
		): OperationResponse<Paths.ListProducts.Responses.$200>;
		/**
		 * createProduct - Create a product (external + member price + stock)
		 */
		post(
			parameters?: Parameters<UnknownParamsObject> | null,
			data?: Paths.CreateProduct.RequestBody,
			config?: AxiosRequestConfig,
		): OperationResponse<Paths.CreateProduct.Responses.$201>;
	};
	['/products/{id}']: {
		/**
		 * getProduct - Get a product
		 */
		get(
			parameters?: Parameters<Paths.GetProduct.PathParameters> | null,
			data?: any,
			config?: AxiosRequestConfig,
		): OperationResponse<Paths.GetProduct.Responses.$200>;
		/**
		 * updateProduct - Update a product
		 */
		patch(
			parameters?: Parameters<Paths.UpdateProduct.PathParameters> | null,
			data?: Paths.UpdateProduct.RequestBody,
			config?: AxiosRequestConfig,
		): OperationResponse<Paths.UpdateProduct.Responses.$200>;
		/**
		 * deleteProduct - Archive a product (soft delete — preserves sale history)
		 */
		delete(
			parameters?: Parameters<Paths.DeleteProduct.PathParameters> | null,
			data?: any,
			config?: AxiosRequestConfig,
		): OperationResponse<Paths.DeleteProduct.Responses.$204>;
	};
	['/products/{id}/variants']: {
		/**
		 * listVariants - List a product’s variants
		 */
		get(
			parameters?: Parameters<Paths.ListVariants.PathParameters> | null,
			data?: any,
			config?: AxiosRequestConfig,
		): OperationResponse<Paths.ListVariants.Responses.$200>;
		/**
		 * createVariant - Create a variant (sub-product) under a product
		 */
		post(
			parameters?: Parameters<Paths.CreateVariant.PathParameters> | null,
			data?: Paths.CreateVariant.RequestBody,
			config?: AxiosRequestConfig,
		): OperationResponse<Paths.CreateVariant.Responses.$201>;
	};
	['/products/{id}/image']: {
		/**
		 * setProductImage - Upload or replace a product photo (jpeg/png/webp, ≤ 512 KB)
		 */
		put(
			parameters?: Parameters<Paths.SetProductImage.PathParameters> | null,
			data?: any,
			config?: AxiosRequestConfig,
		): OperationResponse<Paths.SetProductImage.Responses.$200>;
		/**
		 * deleteProductImage - Delete a product photo
		 */
		delete(
			parameters?: Parameters<Paths.DeleteProductImage.PathParameters> | null,
			data?: any,
			config?: AxiosRequestConfig,
		): OperationResponse<Paths.DeleteProductImage.Responses.$204>;
	};
	['/products/{id}/stock']: {
		/**
		 * getProductStock - Get product stock
		 */
		get(
			parameters?: Parameters<Paths.GetProductStock.PathParameters> | null,
			data?: any,
			config?: AxiosRequestConfig,
		): OperationResponse<Paths.GetProductStock.Responses.$200>;
		/**
		 * setProductStock - Set absolute product stock
		 */
		put(
			parameters?: Parameters<Paths.SetProductStock.PathParameters> | null,
			data?: Paths.SetProductStock.RequestBody,
			config?: AxiosRequestConfig,
		): OperationResponse<Paths.SetProductStock.Responses.$200>;
	};
	['/products/{id}/option-groups']: {
		/**
		 * listOptionGroups - List a product’s option groups
		 */
		get(
			parameters?: Parameters<Paths.ListOptionGroups.PathParameters> | null,
			data?: any,
			config?: AxiosRequestConfig,
		): OperationResponse<Paths.ListOptionGroups.Responses.$200>;
		/**
		 * createOptionGroup - Create an option group on a product
		 */
		post(
			parameters?: Parameters<Paths.CreateOptionGroup.PathParameters> | null,
			data?: Paths.CreateOptionGroup.RequestBody,
			config?: AxiosRequestConfig,
		): OperationResponse<Paths.CreateOptionGroup.Responses.$201>;
	};
	['/option-groups/{groupId}']: {
		/**
		 * updateOptionGroup - Update an option group
		 */
		patch(
			parameters?: Parameters<Paths.UpdateOptionGroup.PathParameters> | null,
			data?: Paths.UpdateOptionGroup.RequestBody,
			config?: AxiosRequestConfig,
		): OperationResponse<Paths.UpdateOptionGroup.Responses.$200>;
		/**
		 * deleteOptionGroup - Delete an option group (and its options)
		 */
		delete(
			parameters?: Parameters<Paths.DeleteOptionGroup.PathParameters> | null,
			data?: any,
			config?: AxiosRequestConfig,
		): OperationResponse<Paths.DeleteOptionGroup.Responses.$204>;
	};
	['/option-groups/{groupId}/options']: {
		/**
		 * createOption - Add an option to a group
		 */
		post(
			parameters?: Parameters<Paths.CreateOption.PathParameters> | null,
			data?: Paths.CreateOption.RequestBody,
			config?: AxiosRequestConfig,
		): OperationResponse<Paths.CreateOption.Responses.$201>;
	};
	['/options/{optionId}']: {
		/**
		 * updateOption - Update an option
		 */
		patch(
			parameters?: Parameters<Paths.UpdateOption.PathParameters> | null,
			data?: Paths.UpdateOption.RequestBody,
			config?: AxiosRequestConfig,
		): OperationResponse<Paths.UpdateOption.Responses.$200>;
		/**
		 * deleteOption - Delete an option
		 */
		delete(
			parameters?: Parameters<Paths.DeleteOption.PathParameters> | null,
			data?: any,
			config?: AxiosRequestConfig,
		): OperationResponse<Paths.DeleteOption.Responses.$204>;
	};
	['/grids']: {
		/**
		 * listGrids - List grids (active only unless the caller manages catalogue)
		 */
		get(
			parameters?: Parameters<UnknownParamsObject> | null,
			data?: any,
			config?: AxiosRequestConfig,
		): OperationResponse<Paths.ListGrids.Responses.$200>;
		/**
		 * createGrid - Create a grid
		 */
		post(
			parameters?: Parameters<UnknownParamsObject> | null,
			data?: Paths.CreateGrid.RequestBody,
			config?: AxiosRequestConfig,
		): OperationResponse<Paths.CreateGrid.Responses.$201>;
	};
	['/grids/reorder']: {
		/**
		 * reorderGrids - Reorder grids (drag-and-drop)
		 */
		put(
			parameters?: Parameters<UnknownParamsObject> | null,
			data?: Paths.ReorderGrids.RequestBody,
			config?: AxiosRequestConfig,
		): OperationResponse<Paths.ReorderGrids.Responses.$204>;
	};
	['/grids/{id}']: {
		/**
		 * getGrid - Get a grid with products + prices + stock
		 */
		get(
			parameters?: Parameters<Paths.GetGrid.PathParameters> | null,
			data?: any,
			config?: AxiosRequestConfig,
		): OperationResponse<Paths.GetGrid.Responses.$200>;
		/**
		 * updateGrid - Update a grid
		 */
		patch(
			parameters?: Parameters<Paths.UpdateGrid.PathParameters> | null,
			data?: Paths.UpdateGrid.RequestBody,
			config?: AxiosRequestConfig,
		): OperationResponse<Paths.UpdateGrid.Responses.$200>;
		/**
		 * removeGrid - Delete a grid
		 */
		delete(
			parameters?: Parameters<Paths.RemoveGrid.PathParameters> | null,
			data?: any,
			config?: AxiosRequestConfig,
		): OperationResponse<Paths.RemoveGrid.Responses.$204>;
	};
	['/grids/{id}/items']: {
		/**
		 * addGridItem - Add a product to a grid
		 */
		post(
			parameters?: Parameters<Paths.AddGridItem.PathParameters> | null,
			data?: Paths.AddGridItem.RequestBody,
			config?: AxiosRequestConfig,
		): OperationResponse<Paths.AddGridItem.Responses.$201>;
	};
	['/grids/{id}/items/reorder']: {
		/**
		 * reorderGridItems - Reorder a grid’s items (drag-and-drop)
		 */
		put(
			parameters?: Parameters<Paths.ReorderGridItems.PathParameters> | null,
			data?: Paths.ReorderGridItems.RequestBody,
			config?: AxiosRequestConfig,
		): OperationResponse<Paths.ReorderGridItems.Responses.$200>;
	};
	['/grids/{id}/items/{productId}']: {
		/**
		 * removeGridItem - Remove a product from a grid
		 */
		delete(
			parameters?: Parameters<Paths.RemoveGridItem.PathParameters> | null,
			data?: any,
			config?: AxiosRequestConfig,
		): OperationResponse<Paths.RemoveGridItem.Responses.$204>;
	};
	['/orders']: {
		/**
		 * createOrder - Create an order — cash finalizes; a card mean opens it pending
		 */
		post(
			parameters?: Parameters<UnknownParamsObject> | null,
			data?: Paths.CreateOrder.RequestBody,
			config?: AxiosRequestConfig,
		): OperationResponse<Paths.CreateOrder.Responses.$201>;
	};
	['/orders/reconcile']: {
		/**
		 * reconcileOrders - Reconcile pending card orders against SumUp (D24)
		 */
		post(
			parameters?: Parameters<UnknownParamsObject> | null,
			data?: any,
			config?: AxiosRequestConfig,
		): OperationResponse<Paths.ReconcileOrders.Responses.$201>;
	};
	['/orders/{id}/confirm']: {
		/**
		 * confirmOrder - Confirm a card order → finalize the sale
		 */
		post(
			parameters?: Parameters<Paths.ConfirmOrder.PathParameters> | null,
			data?: Paths.ConfirmOrder.RequestBody,
			config?: AxiosRequestConfig,
		): OperationResponse<Paths.ConfirmOrder.Responses.$201>;
	};
	['/orders/{id}/decline']: {
		/**
		 * declineOrder - Decline a card order — payment refused → order cancelled
		 */
		post(
			parameters?: Parameters<Paths.DeclineOrder.PathParameters> | null,
			data?: any,
			config?: AxiosRequestConfig,
		): OperationResponse<Paths.DeclineOrder.Responses.$201>;
	};
	['/sales/{id}/refund']: {
		/**
		 * refund - Cancel / refund a completed sale (D12)
		 */
		post(
			parameters?: Parameters<Paths.Refund.PathParameters> | null,
			data?: Paths.Refund.RequestBody,
			config?: AxiosRequestConfig,
		): OperationResponse<Paths.Refund.Responses.$201>;
	};
	['/sales']: {
		/**
		 * listSales - List sales (paginated, filterable)
		 */
		get(
			parameters?: Parameters<Paths.ListSales.QueryParameters> | null,
			data?: any,
			config?: AxiosRequestConfig,
		): OperationResponse<Paths.ListSales.Responses.$200>;
	};
	['/sales/{id}']: {
		/**
		 * getSale - Get a sale with its line items
		 */
		get(
			parameters?: Parameters<Paths.GetSale.PathParameters> | null,
			data?: any,
			config?: AxiosRequestConfig,
		): OperationResponse<Paths.GetSale.Responses.$200>;
	};
	['/reports/revenue']: {
		/**
		 * revenue - Revenue (CA) by payment method over a period
		 */
		get(
			parameters?: Parameters<Paths.Revenue.QueryParameters> | null,
			data?: any,
			config?: AxiosRequestConfig,
		): OperationResponse<Paths.Revenue.Responses.$200>;
	};
	['/reports/products']: {
		/**
		 * salesByProduct - Sales aggregated by product (best-sellers)
		 */
		get(
			parameters?: Parameters<Paths.SalesByProduct.QueryParameters> | null,
			data?: any,
			config?: AxiosRequestConfig,
		): OperationResponse<Paths.SalesByProduct.Responses.$200>;
	};
	['/reports/timeseries']: {
		/**
		 * revenueTimeseries - Daily revenue time-series for the dashboard
		 */
		get(
			parameters?: Parameters<Paths.RevenueTimeseries.QueryParameters> | null,
			data?: any,
			config?: AxiosRequestConfig,
		): OperationResponse<Paths.RevenueTimeseries.Responses.$200>;
	};
	['/reports/sales.csv']: {
		/**
		 * exportCsv - Export sales as CSV (trésorier)
		 */
		get(
			parameters?: Parameters<Paths.ExportCsv.QueryParameters> | null,
			data?: any,
			config?: AxiosRequestConfig,
		): OperationResponse<Paths.ExportCsv.Responses.$200>;
	};
	['/adherents/search']: {
		/**
		 * searchAdherents - Search adherents (to attach member pricing)
		 */
		get(
			parameters?: Parameters<Paths.SearchAdherents.QueryParameters> | null,
			data?: any,
			config?: AxiosRequestConfig,
		): OperationResponse<Paths.SearchAdherents.Responses.$200>;
	};
	['/adherents']: {
		/**
		 * listAdherents - List/search adherents (full registry)
		 */
		get(
			parameters?: Parameters<Paths.ListAdherents.QueryParameters> | null,
			data?: any,
			config?: AxiosRequestConfig,
		): OperationResponse<Paths.ListAdherents.Responses.$200>;
		/**
		 * createAdherent - Register an adherent
		 */
		post(
			parameters?: Parameters<UnknownParamsObject> | null,
			data?: Paths.CreateAdherent.RequestBody,
			config?: AxiosRequestConfig,
		): OperationResponse<Paths.CreateAdherent.Responses.$201>;
	};
	['/adherents/{id}']: {
		/**
		 * getAdherent - Get an adherent
		 */
		get(
			parameters?: Parameters<Paths.GetAdherent.PathParameters> | null,
			data?: any,
			config?: AxiosRequestConfig,
		): OperationResponse<Paths.GetAdherent.Responses.$200>;
		/**
		 * updateAdherent - Update an adherent
		 */
		patch(
			parameters?: Parameters<Paths.UpdateAdherent.PathParameters> | null,
			data?: Paths.UpdateAdherent.RequestBody,
			config?: AxiosRequestConfig,
		): OperationResponse<Paths.UpdateAdherent.Responses.$200>;
		/**
		 * removeAdherent - Delete an adherent
		 */
		delete(
			parameters?: Parameters<Paths.RemoveAdherent.PathParameters> | null,
			data?: any,
			config?: AxiosRequestConfig,
		): OperationResponse<Paths.RemoveAdherent.Responses.$204>;
	};
	['/adherents/{id}/memberships']: {
		/**
		 * addMembership - Add a membership to an adherent
		 */
		post(
			parameters?: Parameters<Paths.AddMembership.PathParameters> | null,
			data?: Paths.AddMembership.RequestBody,
			config?: AxiosRequestConfig,
		): OperationResponse<Paths.AddMembership.Responses.$201>;
	};
	['/adherents/{id}/memberships/{membershipId}/expire']: {
		/**
		 * expireMembership - Expire a membership
		 */
		post(
			parameters?: Parameters<Paths.ExpireMembership.PathParameters> | null,
			data?: any,
			config?: AxiosRequestConfig,
		): OperationResponse<Paths.ExpireMembership.Responses.$201>;
	};
	['/academic-years']: {
		/**
		 * listYears - List academic years
		 */
		get(
			parameters?: Parameters<UnknownParamsObject> | null,
			data?: any,
			config?: AxiosRequestConfig,
		): OperationResponse<Paths.ListYears.Responses.$200>;
		/**
		 * createYear - Create an academic year
		 */
		post(
			parameters?: Parameters<UnknownParamsObject> | null,
			data?: Paths.CreateYear.RequestBody,
			config?: AxiosRequestConfig,
		): OperationResponse<Paths.CreateYear.Responses.$201>;
	};
	['/academic-years/{yearId}']: {
		/**
		 * updateYear - Update an academic year (e.g. set current)
		 */
		patch(
			parameters?: Parameters<Paths.UpdateYear.PathParameters> | null,
			data?: Paths.UpdateYear.RequestBody,
			config?: AxiosRequestConfig,
		): OperationResponse<Paths.UpdateYear.Responses.$200>;
	};
	['/members']: {
		/**
		 * listMembers - List tenant members with their roles
		 */
		get(
			parameters?: Parameters<UnknownParamsObject> | null,
			data?: any,
			config?: AxiosRequestConfig,
		): OperationResponse<Paths.ListMembers.Responses.$200>;
	};
	['/members/{userSub}/roles']: {
		/**
		 * listRoles - List a member's roles
		 */
		get(
			parameters?: Parameters<Paths.ListRoles.PathParameters> | null,
			data?: any,
			config?: AxiosRequestConfig,
		): OperationResponse<Paths.ListRoles.Responses.$200>;
	};
	['/members/{userSub}/roles/{role}']: {
		/**
		 * grant - Grant a role to a member (idempotent)
		 */
		put(
			parameters?: Parameters<Paths.Grant.PathParameters> | null,
			data?: any,
			config?: AxiosRequestConfig,
		): OperationResponse<Paths.Grant.Responses.$200>;
		/**
		 * revoke - Revoke a role from a member (idempotent)
		 */
		delete(
			parameters?: Parameters<Paths.Revoke.PathParameters> | null,
			data?: any,
			config?: AxiosRequestConfig,
		): OperationResponse<Paths.Revoke.Responses.$200>;
	};
	['/invite-codes']: {
		/**
		 * createInviteCode - Create an invite code (raw code shown once)
		 */
		post(
			parameters?: Parameters<UnknownParamsObject> | null,
			data?: Paths.CreateInviteCode.RequestBody,
			config?: AxiosRequestConfig,
		): OperationResponse<Paths.CreateInviteCode.Responses.$201>;
		/**
		 * listInviteCodes - List invite codes (no raw code)
		 */
		get(
			parameters?: Parameters<UnknownParamsObject> | null,
			data?: any,
			config?: AxiosRequestConfig,
		): OperationResponse<Paths.ListInviteCodes.Responses.$200>;
	};
	['/invite-codes/{codeId}']: {
		/**
		 * revokeInviteCode - Revoke an invite code
		 */
		delete(
			parameters?: Parameters<Paths.RevokeInviteCode.PathParameters> | null,
			data?: any,
			config?: AxiosRequestConfig,
		): OperationResponse<Paths.RevokeInviteCode.Responses.$200>;
	};
	['/app-version']: {
		/**
		 * setAppVersion - Set the tenant's app-version policy
		 */
		put(
			parameters?: Parameters<UnknownParamsObject> | null,
			data?: Paths.SetAppVersion.RequestBody,
			config?: AxiosRequestConfig,
		): OperationResponse<Paths.SetAppVersion.Responses.$200>;
	};
	['/payment-method-config']: {
		/**
		 * list - Enabled payment means for this tenant (POS), with SumUp keys
		 */
		get(
			parameters?: Parameters<UnknownParamsObject> | null,
			data?: any,
			config?: AxiosRequestConfig,
		): OperationResponse<Paths.List.Responses.$200>;
	};
	['/me/profile']: {
		/**
		 * profile - Current user on this tenant: roles + permissions
		 */
		get(
			parameters?: Parameters<UnknownParamsObject> | null,
			data?: any,
			config?: AxiosRequestConfig,
		): OperationResponse<Paths.Profile.Responses.$200>;
	};
	['/me/sales']: {
		/**
		 * mySales - The current vendeur's own sales (all statuses, newest first)
		 */
		get(
			parameters?: Parameters<UnknownParamsObject> | null,
			data?: any,
			config?: AxiosRequestConfig,
		): OperationResponse<Paths.MySales.Responses.$200>;
	};
	['/t/{tenantId}/media/products/{id}/image']: {
		/**
		 * productImage - Get a product photo (public, cacheable)
		 */
		get(
			parameters?: Parameters<Paths.ProductImage.PathParameters> | null,
			data?: any,
			config?: AxiosRequestConfig,
		): OperationResponse<Paths.ProductImage.Responses.$200>;
	};
	['/platform/tenants']: {
		/**
		 * create - Create a tenant (registry + first admin tuple)
		 */
		post(
			parameters?: Parameters<UnknownParamsObject> | null,
			data?: Paths.Create.RequestBody,
			config?: AxiosRequestConfig,
		): OperationResponse<Paths.Create.Responses.$201>;
	};
}

export type Client = OpenAPIClient<OperationMethods, PathsDictionary>;

export type AcademicYearResponseDto =
	Components.Schemas.AcademicYearResponseDto;
export type AddGridItemDto = Components.Schemas.AddGridItemDto;
export type AdherentSearchResultDto =
	Components.Schemas.AdherentSearchResultDto;
export type CartItemDto = Components.Schemas.CartItemDto;
export type ConfirmOrderDto = Components.Schemas.ConfirmOrderDto;
export type CreateAcademicYearDto = Components.Schemas.CreateAcademicYearDto;
export type CreateGridDto = Components.Schemas.CreateGridDto;
export type CreateInviteCodeDto = Components.Schemas.CreateInviteCodeDto;
export type CreateMembershipDto = Components.Schemas.CreateMembershipDto;
export type CreateOptionDto = Components.Schemas.CreateOptionDto;
export type CreateOptionGroupDto = Components.Schemas.CreateOptionGroupDto;
export type CreateOrderDto = Components.Schemas.CreateOrderDto;
export type CreatePersonDto = Components.Schemas.CreatePersonDto;
export type CreateProductDto = Components.Schemas.CreateProductDto;
export type CreateTenantDto = Components.Schemas.CreateTenantDto;
export type GridItemOptionDto = Components.Schemas.GridItemOptionDto;
export type GridItemOptionGroupDto = Components.Schemas.GridItemOptionGroupDto;
export type GridItemViewDto = Components.Schemas.GridItemViewDto;
export type GridResponseDto = Components.Schemas.GridResponseDto;
export type GridViewDto = Components.Schemas.GridViewDto;
export type InviteCodeCreatedDto = Components.Schemas.InviteCodeCreatedDto;
export type InviteCodeDto = Components.Schemas.InviteCodeDto;
export type JoinResultDto = Components.Schemas.JoinResultDto;
export type JoinTenantDto = Components.Schemas.JoinTenantDto;
export type MeDto = Components.Schemas.MeDto;
export type MePermissionsDto = Components.Schemas.MePermissionsDto;
export type MeProfileDto = Components.Schemas.MeProfileDto;
export type MemberRolesResponseDto = Components.Schemas.MemberRolesResponseDto;
export type MembershipResponseDto = Components.Schemas.MembershipResponseDto;
export type MyTenantDto = Components.Schemas.MyTenantDto;
export type OptionGroupResponseDto = Components.Schemas.OptionGroupResponseDto;
export type OptionResponseDto = Components.Schemas.OptionResponseDto;
export type PaginatedSalesDto = Components.Schemas.PaginatedSalesDto;
export type PaymentMethodConfigDto = Components.Schemas.PaymentMethodConfigDto;
export type PersonResponseDto = Components.Schemas.PersonResponseDto;
export type ProductResponseDto = Components.Schemas.ProductResponseDto;
export type ProductSalesRowDto = Components.Schemas.ProductSalesRowDto;
export type RefundSaleDto = Components.Schemas.RefundSaleDto;
export type ReorderDto = Components.Schemas.ReorderDto;
export type ReorderEntryDto = Components.Schemas.ReorderEntryDto;
export type RevenueBucketDto = Components.Schemas.RevenueBucketDto;
export type RevenueByMethodDto = Components.Schemas.RevenueByMethodDto;
export type RevenueResponseDto = Components.Schemas.RevenueResponseDto;
export type SaleItemResponseDto = Components.Schemas.SaleItemResponseDto;
export type SaleListRowDto = Components.Schemas.SaleListRowDto;
export type SaleResponseDto = Components.Schemas.SaleResponseDto;
export type SetStockDto = Components.Schemas.SetStockDto;
export type StockResponseDto = Components.Schemas.StockResponseDto;
export type TenantCreatedDto = Components.Schemas.TenantCreatedDto;
export type UpdateAcademicYearDto = Components.Schemas.UpdateAcademicYearDto;
export type UpdateGridDto = Components.Schemas.UpdateGridDto;
export type UpdateOptionDto = Components.Schemas.UpdateOptionDto;
export type UpdateOptionGroupDto = Components.Schemas.UpdateOptionGroupDto;
export type UpdatePersonDto = Components.Schemas.UpdatePersonDto;
export type UpdateProductDto = Components.Schemas.UpdateProductDto;
export type UpsertAppVersionDto = Components.Schemas.UpsertAppVersionDto;
export type VariantViewDto = Components.Schemas.VariantViewDto;
