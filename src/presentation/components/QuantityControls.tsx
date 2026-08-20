import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { FONT } from '../theme';

interface Props {
	quantity: number;
	onIncrement: () => void;
	onDecrement: () => void;
	onRemove: () => void;
}

/**
 * Trash button (clears the line) next to a −/+ stepper, shared by the basket rows and the
 * detail sheet. At quantity 0 the trash is hidden but keeps its footprint, so the layout
 * never resizes. Designed for a white surface: the grey stepper needs a non-grey backdrop.
 */
export function QuantityControls({
	quantity,
	onIncrement,
	onDecrement,
	onRemove,
}: Props) {
	const empty = quantity === 0;
	return (
		<View style={styles.controls}>
			<Pressable
				onPress={onRemove}
				disabled={empty}
				style={[styles.removeBtn, empty && styles.hidden]}
			>
				<Ionicons name="trash-outline" size={22} color="#A91B3A" />
			</Pressable>
			<View style={styles.stepper}>
				<Pressable
					onPress={onDecrement}
					disabled={empty}
					style={[styles.stepBtn, empty && styles.stepBtnDisabled]}
				>
					<Ionicons name="remove" size={22} color="#1A1A1A" />
				</Pressable>
				<Text style={styles.qty}>{quantity}</Text>
				<Pressable onPress={onIncrement} style={styles.stepBtn}>
					<Ionicons name="add" size={22} color="#1A1A1A" />
				</Pressable>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	controls: { flexDirection: 'row', alignItems: 'center', gap: 12 },
	removeBtn: {
		width: 36,
		height: 36,
		borderRadius: 18,
		backgroundColor: '#E5E1DA',
		alignItems: 'center',
		justifyContent: 'center',
	},
	stepper: { flexDirection: 'row', alignItems: 'center', gap: 16 },
	stepBtn: {
		width: 36,
		height: 36,
		borderRadius: 18,
		backgroundColor: '#E5E1DA',
		alignItems: 'center',
		justifyContent: 'center',
	},
	stepBtnDisabled: { opacity: 0.4 },
	qty: {
		fontSize: 18,
		fontFamily: FONT.bold,
		color: '#1A1A1A',
		minWidth: 24,
		textAlign: 'center',
	},
	// Keeps the element's footprint but makes it invisible, so toggling it on/off never
	// resizes a fixed-height parent.
	hidden: { opacity: 0 },
});
