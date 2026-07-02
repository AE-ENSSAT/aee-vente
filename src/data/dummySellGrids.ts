import type { Product, SellGrid } from '@/src/domain/models';

/** Every sell grid is 3 cells wide. */
const COLUMNS = 3;

/** A product plus where it sits in its grid. Authoring shape only. */
type PlacedProduct = Product & { x: number; y: number };

/**
 * Build a sell grid from a flat list of products, each carrying its (x, y) cell. Any cell not
 * listed is left empty — so empty squares (anywhere, including the middle) are just gaps in
 * the coordinates. `rows` is derived from the largest y.
 */
function grid(id: string, name: string, products: PlacedProduct[]): SellGrid {
	const items = products.map(({ x, y, ...product }) => ({ product, x, y }));
	const rows = products.reduce((max, p) => Math.max(max, p.y), 0) + 1;
	return { id, name, columns: COLUMNS, rows, items };
}

/**
 * Hard-coded sell grids used during development. The API will return this exact
 * {@link SellGrid}[] shape, so only this file (and the repository) go away later.
 * Products priced through variants carry no own price; prices are in cents.
 */
export const DUMMY_SELL_GRIDS: SellGrid[] = [
	grid('drinks', 'Boissons', [
		{ id: 'water', name: 'Eau', price: 100, color: '#0891b2', x: 0, y: 0 },
		{ id: 'coke', name: 'Coca', price: 200, color: '#dc2626', x: 1, y: 0 },
		{
			id: 'beer',
			name: 'Bière',
			color: '#d97706',
			x: 2,
			y: 0,
			variants: [
				{ id: 'beer-demi', name: 'Demi (25cl)', price: 250 },
				{ id: 'beer-pinte', name: 'Pinte (50cl)', price: 450 },
			],
		},
		{
			id: 'coffee',
			name: 'Café',
			color: '#78350f',
			x: 0,
			y: 1,
			variants: [
				{ id: 'coffee-s', name: 'Petit', price: 120 },
				{ id: 'coffee-l', name: 'Grand', price: 180 },
			],
		},
		// (1, 1) intentionally left empty.
		{ id: 'tea', name: 'Thé', price: 150, color: '#16a34a', x: 2, y: 1 },
		{ id: 'juice', name: 'Jus', price: 250, color: '#ea580c', x: 0, y: 2 },
		{ id: 'wine', name: 'Vin', price: 400, color: '#7c3aed', x: 1, y: 2 },
		{
			id: 'syrup',
			name: 'Sirop',
			price: 100,
			color: '#db2777',
			x: 2,
			y: 2,
		},
	]),
	grid('snacks', 'Snacks', [
		{
			id: 'chips',
			name: 'Chips',
			price: 150,
			color: '#ca8a04',
			x: 0,
			y: 0,
		},
		{
			id: 'candy',
			name: 'Bonbons',
			price: 100,
			color: '#db2777',
			x: 1,
			y: 0,
		},
		{
			id: 'cake',
			name: 'Gâteau',
			price: 200,
			color: '#9333ea',
			x: 2,
			y: 0,
		},
		{
			id: 'sandwich',
			name: 'Sandwich',
			price: 350,
			color: '#16a34a',
			x: 0,
			y: 1,
		},
		{
			id: 'cookie',
			name: 'Cookie',
			price: 150,
			color: '#b45309',
			x: 1,
			y: 1,
		},
		{
			id: 'popcorn',
			name: 'Popcorn',
			price: 200,
			color: '#0891b2',
			x: 2,
			y: 1,
		},
	]),
	grid('goodies', 'Goodies', [
		{
			id: 'tshirt',
			name: 'T-shirt',
			price: 1200,
			color: '#2563eb',
			x: 0,
			y: 0,
		},
		{
			id: 'sticker',
			name: 'Sticker',
			price: 200,
			color: '#16a34a',
			x: 1,
			y: 0,
		},
		{ id: 'mug', name: 'Mug', price: 800, color: '#dc2626', x: 2, y: 0 },
		{
			id: 'tote',
			name: 'Tote bag',
			price: 600,
			color: '#7c3aed',
			x: 0,
			y: 1,
		},
		// (1, 1) intentionally left empty.
		{
			id: 'badge',
			name: 'Badge',
			price: 150,
			color: '#d97706',
			x: 2,
			y: 1,
		},
	]),
	grid('meals', 'Repas', [
		{
			id: 'pizza',
			name: 'Pizza',
			color: '#dc2626',
			x: 0,
			y: 0,
			variants: [
				{ id: 'pizza-marg', name: 'Margherita', price: 800 },
				{ id: 'pizza-reine', name: 'Reine', price: 950 },
				{ id: 'pizza-4f', name: '4 Fromages', price: 1000 },
			],
		},
		{
			id: 'burger',
			name: 'Burger',
			price: 600,
			color: '#b45309',
			x: 1,
			y: 0,
		},
		{
			id: 'hotdog',
			name: 'Hot-dog',
			price: 400,
			color: '#ea580c',
			x: 2,
			y: 0,
		},
		{
			id: 'pasta',
			name: 'Pâtes',
			price: 550,
			color: '#ca8a04',
			x: 0,
			y: 1,
		},
		{
			id: 'salad',
			name: 'Salade',
			price: 450,
			color: '#16a34a',
			x: 1,
			y: 1,
		},
		{
			id: 'fries',
			name: 'Frites',
			price: 300,
			color: '#d97706',
			x: 2,
			y: 1,
		},
		{ id: 'wrap', name: 'Wrap', price: 500, color: '#65a30d', x: 0, y: 2 },
	]),
	grid('desserts', 'Desserts', [
		{
			id: 'icecream',
			name: 'Glace',
			price: 250,
			color: '#0891b2',
			x: 0,
			y: 0,
		},
		{
			id: 'crepe',
			name: 'Crêpe',
			price: 300,
			color: '#d97706',
			x: 1,
			y: 0,
		},
		{
			id: 'waffle',
			name: 'Gaufre',
			price: 350,
			color: '#b45309',
			x: 2,
			y: 0,
		},
		{ id: 'tart', name: 'Tarte', price: 400, color: '#dc2626', x: 0, y: 1 },
		{
			id: 'brownie',
			name: 'Brownie',
			price: 300,
			color: '#78350f',
			x: 1,
			y: 1,
		},
		{
			id: 'donut',
			name: 'Donut',
			price: 250,
			color: '#db2777',
			x: 2,
			y: 1,
		},
	]),
	grid('breakfast', 'Petit-déj', [
		{
			id: 'croissant',
			name: 'Croissant',
			price: 150,
			color: '#d97706',
			x: 0,
			y: 0,
		},
		{
			id: 'painchoc',
			name: 'Pain choc.',
			price: 180,
			color: '#78350f',
			x: 1,
			y: 0,
		},
		{
			id: 'ojuice',
			name: 'Jus d’orange',
			price: 250,
			color: '#ea580c',
			x: 2,
			y: 0,
		},
		{
			id: 'yogurt',
			name: 'Yaourt',
			price: 200,
			color: '#0891b2',
			x: 0,
			y: 1,
		},
		{
			id: 'granola',
			name: 'Granola',
			price: 300,
			color: '#ca8a04',
			x: 1,
			y: 1,
		},
	]),
	grid('fruits', 'Fruits', [
		{
			id: 'apple',
			name: 'Pomme',
			price: 100,
			color: '#dc2626',
			x: 0,
			y: 0,
		},
		{
			id: 'banana',
			name: 'Banane',
			price: 100,
			color: '#ca8a04',
			x: 1,
			y: 0,
		},
		{
			id: 'orange',
			name: 'Orange',
			price: 120,
			color: '#ea580c',
			x: 2,
			y: 0,
		},
		{
			id: 'grapes',
			name: 'Raisin',
			price: 200,
			color: '#7c3aed',
			x: 0,
			y: 1,
		},
		{
			id: 'strawberry',
			name: 'Fraise',
			price: 250,
			color: '#e11d48',
			x: 1,
			y: 1,
		},
	]),
];
