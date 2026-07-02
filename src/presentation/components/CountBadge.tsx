import { StyleSheet, Text, View } from 'react-native';
import { FONT } from '../theme';

interface Props {
	count: number;
}

/**
 * Small red count bubble pinned to the top-right of its parent. Shown on the basket
 * button and on product tiles already in the basket. Renders nothing when count is 0.
 */
export function CountBadge({ count }: Props) {
	if (count <= 0) {
		return null;
	}
	return (
		<View style={styles.badge}>
			<Text style={styles.badgeText}>{count}</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	badge: {
		position: 'absolute',
		top: -4,
		right: -4,
		minWidth: 24,
		height: 24,
		borderRadius: 12,
		paddingHorizontal: 6,
		backgroundColor: '#DDCA1C',
		alignItems: 'center',
		justifyContent: 'center',
		borderWidth: 2,
		borderColor: '#ffffff',
	},
	badgeText: { color: '#1A1A1A', fontSize: 12, fontFamily: FONT.bold },
});
