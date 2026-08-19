import { API_BASE_URL } from '@/constants/api';
import { api, type GridItemViewDto, type GridViewDto } from '@/src/api';
import type { Product, SellGrid, SellGridItem } from '@/src/domain/models';
import type { SellGridRepository } from '@/src/domain/SellGridRepository';

/**
 * Tiles per row. The backend orders a grid's items with a flat `position` and leaves the
 * shape to the client, so the POS lays them out three-up — the count the sell screen is
 * designed around (square tiles, `flex: 1` + `aspectRatio: 1`).
 */
const COLUMNS = 3;

/**
 * Absolute URL for a product photo. `imageUrl` may come back as a path
 * (`/t/{tenant}/media/products/{id}/image`), which React Native's `<Image>` can't load —
 * so anchor it to the API's base URL. That media route is public, hence no token needed.
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
 * The catalogue is two levels deep: an item is either a leaf with its own price, or a
 * group whose price is null and whose {@link GridItemViewDto.variants} carry the prices.
 * That is exactly the app's `price` / `variants` split, so the shapes line up — a group
 * opens the detail sheet, a leaf goes straight into the basket.
 *
 * Prices are the **external** ones: member pricing is attached to an order through
 * `memberId`, which the POS doesn't collect yet.
 */
function toProduct(item: GridItemViewDto): Product {
	const variants = item.variants.map((variant) => ({
		// A variant is itself a product server-side; its id is what an order's
		// `variantId` refers to.
		id: variant.productId,
		name: variant.name,
		price: variant.externalPriceCents,
	}));
	const image = toImageUrl(item.imageUrl);

	// The optional domain fields are spread in only when present, so a variant group never
	// carries a `price: undefined` that the basket would read as free.
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
 * {@link SellGridRepository} backed by the AEE Manager API, replacing
 * `DummySellGridRepository`. Because it satisfies the same interface, the sell screen and
 * `useSellGrids` are untouched by the swap.
 *
 * `GET /grids` lists the grids but not their contents, so each one is then fetched with
 * `GET /grids/{id}` — the view that carries products, prices and variants. Those follow-up
 * calls run concurrently, so loading costs one round trip plus one more, not one per grid.
 */
export class ApiSellGridRepository implements SellGridRepository {
	async getSellGrids(): Promise<SellGrid[]> {
		const { data: summaries } = await api.listGrids();
		// A catalogue manager's token also returns inactive grids; the POS shows only
		// what is on sale. `position` is the order chosen in the back-office.
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
