import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import type { Product, SellGrid as SellGridModel } from '@/src/domain/models';
import { APP_MARGIN } from '../theme';
import { ProductTile } from './ProductTile';

const GAP = 10;
/** The app red, for the pull-to-refresh spinner (iOS `tintColor`, Android `colors`). */
const REFRESH_COLOR = '#A91B3A';

interface Props {
	grid: SellGridModel;
	onSelectProduct: (product: Product) => void;
	/** Long-press a tile to open its detail sheet. */
	onLongPressProduct?: (product: Product) => void;
	/** System-bar inset plus the floating basket button, so the last row clears both. */
	bottomInset?: number;
	/** Pull down on the grid to re-read the catalogue. Omit to disable. */
	onRefresh?: () => void;
	refreshing?: boolean;
}

interface Cell {
	key: string;
	product: Product | null;
}

interface Row {
	key: string;
	cells: Cell[];
}

const cellKey = (x: number, y: number) => `${x},${y}`;

/**
 * A `columns` × `rows` matrix of square cells, each product at its own (x, y). Cells split
 * the row evenly (`flex: 1` + `aspectRatio: 1`), so tiles stay square at any column count.
 */
export function SellGrid({
	grid,
	onSelectProduct,
	onLongPressProduct,
	bottomInset = 0,
	onRefresh,
	refreshing = false,
}: Props) {
	const byCell = new Map<string, Product>();
	for (const item of grid.items) {
		byCell.set(cellKey(item.x, item.y), item.product);
	}

	const rows: Row[] = [];
	for (let y = 0; y < grid.rows; y++) {
		const cells: Cell[] = [];
		for (let x = 0; x < grid.columns; x++) {
			cells.push({
				key: cellKey(x, y),
				product: byCell.get(cellKey(x, y)) ?? null,
			});
		}
		rows.push({ key: `row-${y}`, cells });
	}

	return (
		<ScrollView
			style={styles.scroll}
			contentContainerStyle={[
				styles.content,
				{ paddingBottom: APP_MARGIN + bottomInset },
			]}
			// On this vertical list, not the horizontal pager around it: a scroll view only
			// refreshes on the axis it scrolls. Each platform keeps its own native feel.
			refreshControl={
				onRefresh && (
					<RefreshControl
						refreshing={refreshing}
						onRefresh={onRefresh}
						tintColor={REFRESH_COLOR}
						colors={[REFRESH_COLOR]}
					/>
				)
			}
		>
			{rows.map((row) => (
				<View key={row.key} style={styles.row}>
					{row.cells.map((cell) => (
						<View key={cell.key} style={styles.cell}>
							{cell.product ? (
								<ProductTile
									product={cell.product}
									onPress={onSelectProduct}
									onLongPress={onLongPressProduct}
								/>
							) : null}
						</View>
					))}
				</View>
			))}
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	// flex:1 so the grid scrolls internally instead of squashing the pinned header.
	scroll: { flex: 1 },
	// paddingTop so the top row's count badges (a 4px overhang) aren't clipped.
	content: { padding: APP_MARGIN, paddingTop: 8, gap: GAP },
	row: { flexDirection: 'row', gap: GAP },
	cell: { flex: 1, aspectRatio: 1 },
});
