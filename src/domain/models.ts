/** Domain entities — the shapes the UI depends on, whatever data source produces them. */

/** One variant of a product (e.g. a size or flavour) with its own price. */
export interface Variant {
	id: string;
	name: string;
	/** Integer minor units (cents). */
	price: number;
}

export interface Product {
	id: string;
	name: string;
	/** Integer minor units (cents), e.g. 150 = €1.50. Omitted when priced by {@link variants}. */
	price?: number;
	color?: string;
	/** Remote URL; the UI shows a coloured placeholder when absent. */
	image?: string;
	/** When present the product is priced per variant, and its tile opens the detail sheet. */
	variants?: Variant[];
}

export interface SellGridItem {
	product: Product;
	/** Zero-based column, then row. */
	x: number;
	y: number;
}

/** A sell grid: a fixed `columns` × `rows` matrix of square cells, each item at its own (x, y). */
export interface SellGrid {
	id: string;
	name: string;
	columns: number;
	rows: number;
	items: SellGridItem[];
}

/** One basket line: a product (optionally a variant) and its quantity. Each variant is its own line. */
export interface BasketItem {
	product: Product;
	variant: Variant | null;
	quantity: number;
}
