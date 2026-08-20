import { useEffect, useRef } from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { APP_MARGIN, FONT } from '../theme';

/** Gap between pills, reused as the bar's bottom padding (separation from the grid). */
const PILL_GAP = 8;

interface Tab {
	id: string;
	name: string;
}

interface Props {
	tabs: Tab[];
	selectedId: string;
	onSelect: (id: string) => void;
}

/**
 * Horizontal pill selector. Tapping one — or swiping the grid — scrolls it to the centre of
 * the bar, clamped at the ends.
 */
export function GridTabs({ tabs, selectedId, onSelect }: Props) {
	const scrollRef = useRef<ScrollView>(null);
	const centers = useRef<Record<string, number>>({});
	const viewport = useRef(0);

	useEffect(() => {
		const center = centers.current[selectedId];
		if (center !== undefined && viewport.current > 0) {
			// Put the pill's centre at the bar's centre (ScrollView clamps the ends).
			scrollRef.current?.scrollTo({
				x: Math.max(0, center - viewport.current / 2),
				animated: true,
			});
		}
	}, [selectedId]);

	return (
		<ScrollView
			ref={scrollRef}
			horizontal
			showsHorizontalScrollIndicator={false}
			onLayout={(e) => {
				viewport.current = e.nativeEvent.layout.width;
			}}
			style={styles.bar}
			contentContainerStyle={styles.content}
		>
			{tabs.map((tab) => {
				const active = tab.id === selectedId;
				return (
					<Pressable
						key={tab.id}
						onLayout={(e) => {
							const { x, width } = e.nativeEvent.layout;
							centers.current[tab.id] = x + width / 2;
						}}
						onPress={() => onSelect(tab.id)}
						style={[styles.tab, active && styles.tabActive]}
					>
						<Text
							numberOfLines={1}
							style={[styles.label, active && styles.labelActive]}
						>
							{tab.name}
						</Text>
					</Pressable>
				);
			})}
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	// Fixed to its content height so the flex column can't squash and clip the pill text.
	bar: { flexGrow: 0, flexShrink: 0 },
	// paddingBottom is the persistent gap above the grid; it stays put as the grid scrolls.
	content: {
		paddingHorizontal: APP_MARGIN,
		paddingBottom: PILL_GAP,
		gap: PILL_GAP,
	},
	tab: {
		paddingHorizontal: 16,
		paddingVertical: 10,
		borderRadius: 999,
		backgroundColor: '#E5E1DA',
	},
	tabActive: { backgroundColor: '#A91B3A' },
	label: {
		fontSize: 14,
		lineHeight: 20,
		fontFamily: FONT.regular,
		color: '#1A1A1A',
	},
	labelActive: { color: '#ffffff' },
});
