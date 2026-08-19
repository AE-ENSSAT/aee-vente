import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useMemo,
	useReducer,
} from 'react';
import type { BasketItem, Product, Variant } from '@/src/domain/models';

/** Stable identity of a basket line. A no-variant line keys on the product id alone. */
export function basketLineKey(
	productId: string,
	variantId: string | null,
): string {
	return variantId ? `${productId}::${variantId}` : productId;
}

/** The effective unit price of a line: the variant's price, or the product's base price. */
export function linePrice(item: BasketItem): number {
	return item.variant?.price ?? item.product.price ?? 0;
}

const itemKey = (item: BasketItem): string =>
	basketLineKey(item.product.id, item.variant?.id ?? null);

type BasketAction =
	| { type: 'add'; product: Product; variant: Variant | null }
	| { type: 'increment'; key: string }
	| { type: 'decrement'; key: string }
	| { type: 'remove'; key: string }
	| { type: 'clear' };

function basketReducer(
	items: BasketItem[],
	action: BasketAction,
): BasketItem[] {
	switch (action.type) {
		case 'add': {
			const key = basketLineKey(
				action.product.id,
				action.variant?.id ?? null,
			);
			const exists = items.some((i) => itemKey(i) === key);
			if (exists) {
				return items.map((i) =>
					itemKey(i) === key ? { ...i, quantity: i.quantity + 1 } : i,
				);
			}
			return [
				...items,
				{
					product: action.product,
					variant: action.variant,
					quantity: 1,
				},
			];
		}
		case 'increment':
			return items.map((i) =>
				itemKey(i) === action.key
					? { ...i, quantity: i.quantity + 1 }
					: i,
			);
		case 'decrement':
			return items
				.map((i) =>
					itemKey(i) === action.key
						? { ...i, quantity: i.quantity - 1 }
						: i,
				)
				.filter((i) => i.quantity > 0);
		case 'remove':
			return items.filter((i) => itemKey(i) !== action.key);
		case 'clear':
			// Same reference when already empty, so useReducer bails out of the re-render.
			return items.length === 0 ? items : [];
	}
}

interface BasketContextValue {
	items: BasketItem[];
	/** Total units across all lines (drives the basket badge). */
	itemCount: number;
	totalCents: number;
	addProduct: (product: Product, variant?: Variant | null) => void;
	increment: (key: string) => void;
	decrement: (key: string) => void;
	remove: (key: string) => void;
	clear: () => void;
	quantityOf: (productId: string, variantId?: string | null) => number;
}

const BasketContext = createContext<BasketContextValue | null>(null);

export function BasketProvider({ children }: { children: ReactNode }) {
	const [items, dispatch] = useReducer(basketReducer, []);

	// Memoized with no deps so their identity never changes — otherwise every `items` change
	// would re-run consumers that capture them.
	const addProduct = useCallback(
		(product: Product, variant: Variant | null = null) =>
			dispatch({ type: 'add', product, variant }),
		[],
	);
	const increment = useCallback(
		(key: string) => dispatch({ type: 'increment', key }),
		[],
	);
	const decrement = useCallback(
		(key: string) => dispatch({ type: 'decrement', key }),
		[],
	);
	const remove = useCallback(
		(key: string) => dispatch({ type: 'remove', key }),
		[],
	);
	const clear = useCallback(() => dispatch({ type: 'clear' }), []);

	const value = useMemo<BasketContextValue>(() => {
		const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
		const totalCents = items.reduce(
			(sum, i) => sum + i.quantity * linePrice(i),
			0,
		);
		return {
			items,
			itemCount,
			totalCents,
			addProduct,
			increment,
			decrement,
			remove,
			clear,
			quantityOf: (productId, variantId = null) =>
				items.find(
					(i) => itemKey(i) === basketLineKey(productId, variantId),
				)?.quantity ?? 0,
		};
	}, [items, addProduct, increment, decrement, remove, clear]);

	return (
		<BasketContext.Provider value={value}>
			{children}
		</BasketContext.Provider>
	);
}

export function useBasket(): BasketContextValue {
	const ctx = useContext(BasketContext);
	if (!ctx) {
		throw new Error('useBasket must be used within a BasketProvider');
	}
	return ctx;
}
