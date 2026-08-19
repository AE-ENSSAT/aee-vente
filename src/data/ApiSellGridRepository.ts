import { API_BASE_URL } from '@/constants/api';
import { api, type GridItemViewDto, type GridViewDto } from '@/src/api';
import type { Product, SellGrid, SellGridItem } from '@/src/domain/models';
import type { SellGridRepository } from '@/src/domain/SellGridRepository';

/** The backend leaves layout to the client; the sell screen is designed around three-up. */
const COLUMNS = 3;

/**
 * `imageUrl` may come back as a path, which React Native's `<Image>` can't load, so anchor
 * it to the API base. That media route is public, hence no token.
 */
function toImageUrl(imageUrl: string | null): string | undefined {
	if (!imageUrl) {
		return undefined;
	}
	return imageUrl.startsWith('http')
		? imageUrl
		: `${API_BASE_URL}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
}

/**
 * A grid item becomes a domain {@link Product}.
 *
 * The catalogue is two levels deep: an item is either a leaf with its own price or a group
 * whose variants carry the prices — exactly the app's `price` / `variants` split.
 *
 * Prices are the **external** ones: member pricing attaches to an order through `memberId`,
 * which the POS doesn't collect yet.
 */
function toProduct(item: GridItemViewDto): Product {
	const variants = item.variants.map((variant) => ({
		// A variant is itself a product server-side; its id is what `variantId` refers to.
		id: variant.productId,
		name: variant.name,
		price: variant.externalPriceCents,
	}));
	const image = toImageUrl(item.imageUrl);

	// Optional fields are spread in only when present, so a variant group never carries a
	// `price: undefined` that the basket would read as free.
	return {
		id: item.productId,
		name: item.name,
		...(item.externalPriceCents !== null
			? { price: item.externalPriceCents }
			: {}),
		...(variants.length ? { variants } : {}),
		...(image ? { image } : {}),
	};
}

/** Place position-ordered items into a fixed-width matrix, row by row. */
function toGrid(view: GridViewDto): SellGrid {
	const ordered = [...view.items].sort((a, b) => a.position - b.position);
	const items: SellGridItem[] = ordered.map((item, index) => ({
		product: toProduct(item),
		x: index % COLUMNS,
		y: Math.floor(index / COLUMNS),
	}));

	return {
		id: view.id,
		name: view.name,
		columns: COLUMNS,
		rows: Math.ceil(ordered.length / COLUMNS),
		items,
	};
}

/**
 * {@link SellGridRepository} over the AEE Manager API. `GET /grids` lists grids without
 * their contents, so each is then fetched with `GET /grids/{id}` — concurrently, so loading
 * costs one round trip plus one more, not one per grid.
 */
export class ApiSellGridRepository implements SellGridRepository {
	async getSellGrids(): Promise<SellGrid[]> {
		const { data: summaries } = await api.listGrids();
		// A catalogue manager's token also returns inactive grids; the POS shows only what is
		// on sale, in the back-office's `position` order.
		const visible = summaries
			.filter((grid) => grid.active)
			.sort((a, b) => a.position - b.position);

		const views = await Promise.all(
			visible.map(async ({ id }) => {
				const { data } = await api.getGrid({ id });
				return data;
			}),
		);

		return views.map(toGrid);
	}
}
