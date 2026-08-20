import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet } from 'react-native';
import { FAB_GAP, FAB_SIZE } from '../theme';
import { useBottomSpace } from '../useBottomSpace';
import { CountBadge } from './CountBadge';

interface Props {
	count: number;
	onPress: () => void;
}

/** Floating basket button (bottom-right) with a count badge in its top-right corner. */
export function BasketFab({ count, onPress }: Props) {
	// Sit above the system bar. Its container is a top-only SafeAreaView, so this component
	// is the sole owner of the bottom inset here.
	const bottom = useBottomSpace(FAB_GAP);
	return (
		<Pressable
			onPress={onPress}
			style={({ pressed }) => [
				styles.fab,
				{ bottom },
				pressed && styles.pressed,
			]}
		>
			<Ionicons name="cart" size={28} color="#ffffff" />
			<CountBadge count={count} />
		</Pressable>
	);
}

const styles = StyleSheet.create({
	fab: {
		position: 'absolute',
		right: 24,
		width: FAB_SIZE,
		height: FAB_SIZE,
		borderRadius: FAB_SIZE / 2,
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
