import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet } from 'react-native';
import { CountBadge } from './CountBadge';

interface Props {
	count: number;
	onPress: () => void;
}

/** Floating basket button (bottom-right) with a count badge in its top-right corner. */
export function BasketFab({ count, onPress }: Props) {
	return (
		<Pressable
			onPress={onPress}
			style={({ pressed }) => [styles.fab, pressed && styles.pressed]}
		>
			<Ionicons name="cart" size={28} color="#ffffff" />
			<CountBadge count={count} />
		</Pressable>
	);
}

const styles = StyleSheet.create({
	fab: {
		position: 'absolute',
		bottom: 28,
		right: 24,
		width: 64,
		height: 64,
		borderRadius: 32,
		backgroundColor: '#A91B3A',
		alignItems: 'center',
		justifyContent: 'center',
		elevation: 6,
		shadowColor: '#000000',
		shadowOpacity: 0.25,
		shadowRadius: 6,
		shadowOffset: { width: 0, height: 3 },
	},
	pressed: { opacity: 0.85 },
});
