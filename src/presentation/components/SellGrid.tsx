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
	/**
	 * Extra bottom padding for the scroll content — the system-bar inset plus the floating
	 * basket button's clearance — so the last product row is never hidden under either.
	 */
	bottomInset?: number;
	/** Pull down on the grid to re-read the catalogue. Omit to disable. */
	onRefresh?: () => void;
	/** True while {@link onRefresh} is in flight — drives the pull-to-refresh spinner. */
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
 * Renders a sell grid as a fixed {@link SellGridModel.columns} × {@link SellGridModel.rows}
 * matrix of square cells. Each product sits at its own (x, y); any cell without a product is
 * left empty. Cells split the row width evenly (`flex: 1` + `aspectRatio: 1`), so tiles stay
 * square at any column count and the grid scrolls vertically when taller than the screen.
 */
export function SellGrid({
	grid,
	onSelectProduct,
	onLongPressProduct,
	bottomInset = 0,
	onRefresh,
	refreshing = false,
}: Props) {
	// Index the placed products by cell for O(1) lookup while building the matrix.
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
			// Pull-to-refresh belongs on this vertical list, not on the horizontal pager
			// around it: a scroll view only refreshes on the axis it scrolls. Each
			// platform keeps its own native feel — iOS pulls the grid down with the
			// bounce, Android slides a spinner over a grid that stays put.
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
	// flex:1 so the grid fills the space below the pinned title + carousel and
	// scrolls internally, instead of growing and squashing them.
	scroll: { flex: 1 },
	// Small paddingTop so the top row's count badges (which overhang the tile by 4px)
	// aren't clipped at the grid's top edge. The persistent gap below the carousel is
	// still the bar's own paddingBottom.
	content: { padding: APP_MARGIN, paddingTop: 8, gap: GAP },
	row: { flexDirection: 'row', gap: GAP },
	cell: { flex: 1, aspectRatio: 1 },
});
