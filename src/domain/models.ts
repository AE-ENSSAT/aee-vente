/**
 * Core domain entities. These are the contract the UI depends on; the dummy data
 * and (later) the API both produce exactly these shapes, so swapping the data
 * source never touches the presentation layer.
 */

/** One variant of a product (e.g. a size or flavour) with its own price. */
export interface Variant {
	id: string;
	name: string;
	/** Price in integer minor units (cents) for this variant. */
	price: number;
}

/** A sellable product. */
export interface Product {
	id: string;
	name: string;
	/**
	 * Price in integer minor units (cents), e.g. 150 = €1.50 — matches SumUp's amount unit.
	 * Omitted when the product is priced through its {@link variants}.
	 */
	price?: number;
	/** Optional tile accent colour (hex). */
	color?: string;
	/** Optional product photo (remote URL). When absent the UI shows a colored placeholder. */
	image?: string;
	/**
	 * Optional variants. When present, the product isn't added directly: tapping its tile
	 * opens the detail sheet where each variant is selected (its own price and quantity).
	 */
	variants?: Variant[];
}

/** A product placed at a specific cell of a sell grid. */
export interface SellGridItem {
	product: Product;
	/** Zero-based column. */
	x: number;
	/** Zero-based row. */
	y: number;
}

/**
 * A sell grid shown on the sell page: a fixed `columns` × `rows` matrix of square cells.
 * Each product sits at its own (x, y); any cell not covered by an item is left empty. These
 * are authored in a back-office and (later) fetched from the API.
 */
export interface SellGrid {
	id: string;
	name: string;
	columns: number;
	rows: number;
	items: SellGridItem[];
}

/**
 * One line of the basket: a product (optionally a specific variant) and how many of it are
 * selected. A product with no variant has `variant: null`; each variant is its own line.
 */
export interface BasketItem {
	product: Product;
	variant: Variant | null;
	quantity: number;
}
