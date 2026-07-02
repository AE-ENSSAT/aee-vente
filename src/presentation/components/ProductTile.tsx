import { Pressable, StyleSheet, Text } from 'react-native';
import type { Product } from '@/src/domain/models';
import { useBasket } from '@/src/presentation/basket/BasketContext';
import { formatEuros } from '@/src/presentation/money';
import { FONT } from '../theme';
import { CountBadge } from './CountBadge';

interface Props {
	product: Product;
	onPress: (product: Product) => void;
	/** Long-press opens the product detail sheet. */
	onLongPress?: (product: Product) => void;
}

/** A square, tappable product tile. Fills the square cell provided by SellGrid. */
export function ProductTile({ product, onPress, onLongPress }: Props) {
	const { items } = useBasket();
	// Sum every line of this product (a variant product spans several lines).
	const quantity = items.reduce(
		(sum, i) => (i.product.id === product.id ? sum + i.quantity : sum),
		0,
	);

	// With variants, show how many there are; otherwise the flat price.
	const variants = product.variants;
	const subtitle = variants?.length
		? `${variants.length} variante${variants.length > 1 ? 's' : ''}`
		: formatEuros(product.price ?? 0);

	return (
		<Pressable
			onPress={() => onPress(product)}
			onLongPress={onLongPress ? () => onLongPress(product) : undefined}
			style={({ pressed }) => [
				styles.tile,
				{ backgroundColor: product.color ?? '#A91B3A' },
				pressed && styles.pressed,
			]}
		>
			<Text style={styles.name} numberOfLines={2}>
				{product.name}
			</Text>
			<Text style={styles.price}>{subtitle}</Text>
			<CountBadge count={quantity} />
		</Pressable>
	);
}

const styles = StyleSheet.create({
	tile: {
		flex: 1,
		borderRadius: 14,
		padding: 10,
		justifyContent: 'space-between',
	},
	pressed: { opacity: 0.8 },
	name: { color: '#ffffff', fontSize: 15, fontFamily: FONT.bold },
	price: {
		color: '#ffffff',
		fontSize: 14,
		fontFamily: FONT.regular,
		opacity: 0.95,
	},
});
