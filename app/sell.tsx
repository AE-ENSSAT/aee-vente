import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
	ActivityIndicator,
	type NativeScrollEvent,
	type NativeSyntheticEvent,
	ScrollView,
	StyleSheet,
	Text,
	useWindowDimensions,
	View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { Product } from '@/src/domain/models';
import { useBasket } from '@/src/presentation/basket/BasketContext';
import { BasketFab } from '@/src/presentation/components/BasketFab';
import { BasketSheet } from '@/src/presentation/components/BasketSheet';
import { GridTabs } from '@/src/presentation/components/GridTabs';
import { PaymentSuccessOverlay } from '@/src/presentation/components/PaymentSuccessOverlay';
import { ProductDetailSheet } from '@/src/presentation/components/ProductDetailSheet';
import { SellGrid } from '@/src/presentation/components/SellGrid';
import { hapticLongPress, hapticSuccess } from '@/src/presentation/haptics';
import { useSellGrids } from '@/src/presentation/sell/useSellGrids';
import { APP_MARGIN, FONT } from '@/src/presentation/theme';

/** The sell page: grid selector + product grid, with the floating basket + sheet. */
export default function SellScreen() {
	const { grids, loading, error } = useSellGrids();
	const { addProduct, itemCount, clear } = useBasket();
	const { width } = useWindowDimensions();
	const pagerRef = useRef<ScrollView>(null);
	const [selectedId, setSelectedId] = useState<string>('');
	const [basketOpen, setBasketOpen] = useState(false);
	// While true, the success flourish covers the whole app (in a window-level layer above the
	// basket sheet), while the basket empties and the sheet closes behind it, unseen.
	const [celebrating, setCelebrating] = useState(false);
	// The product whose detail sheet is open (long-press a tile), or null when closed.
	const [detailProduct, setDetailProduct] = useState<Product | null>(null);

	// Tap a tile: a product with variants opens its detail sheet (pick variants there);
	// a plain product is added straight to the basket. No haptic on a simple tap.
	const tapProduct = useCallback(
		(product: Product) => {
			if (product.variants?.length) {
				setDetailProduct(product);
			} else {
				addProduct(product);
			}
		},
		[addProduct],
	);

	// Long-press a tile: buzz, then open its detail sheet (works for any product).
	const openDetail = useCallback((product: Product) => {
		hapticLongPress();
		setDetailProduct(product);
	}, []);

	// Payment succeeded — the instant SumUp returns accepted. Pop the flourish on top of
	// everything (with the haptic); then, deferred a frame so the overlay is up first, empty
	// the basket and close the sheet behind it. The overlay is an independent window-level
	// layer, so the sheet's close is never seen.
	const handlePaid = useCallback(() => {
		hapticSuccess();
		setCelebrating(true);
		requestAnimationFrame(() => {
			clear();
			setBasketOpen(false);
		});
	}, [clear]);

	// The closing fade has finished onto the cleared, sheet-less screen — retire the flourish.
	const handleHidden = useCallback(() => {
		setCelebrating(false);
	}, []);

	const tabs = useMemo(
		() => grids.map((g) => ({ id: g.id, name: g.name })),
		[grids],
	);

	// Default the selection to the first grid once loaded (no synthetic "Tout" tab).
	useEffect(() => {
		if (grids.length && !grids.some((g) => g.id === selectedId)) {
			setSelectedId(grids[0].id);
		}
	}, [grids, selectedId]);

	// Tap a pill: select it and page the grid across to it.
	const selectTab = useCallback(
		(id: string) => {
			setSelectedId(id);
			const index = grids.findIndex((g) => g.id === id);
			if (index >= 0) {
				pagerRef.current?.scrollTo({
					x: index * width,
					animated: true,
				});
			}
		},
		[grids, width],
	);

	// Swiping the grid between pages updates the selection.
	const onPagerScrollEnd = useCallback(
		(e: NativeSyntheticEvent<NativeScrollEvent>) => {
			const index = Math.round(e.nativeEvent.contentOffset.x / width);
			const id = grids[index]?.id;
			if (id) {
				setSelectedId(id);
			}
		},
		[grids, width],
	);

	return (
		<SafeAreaView style={styles.safe} edges={['top']}>
			<Text style={styles.title}>AEE Vente</Text>

			{loading ? (
				<View style={styles.center}>
					<ActivityIndicator />
				</View>
			) : error ? (
				<View style={styles.center}>
					<Text style={styles.error}>
						Erreur de chargement : {error}
					</Text>
				</View>
			) : (
				<>
					<GridTabs
						tabs={tabs}
						selectedId={selectedId}
						onSelect={selectTab}
					/>
					<ScrollView
						ref={pagerRef}
						horizontal
						pagingEnabled
						showsHorizontalScrollIndicator={false}
						onMomentumScrollEnd={onPagerScrollEnd}
						style={styles.pager}
					>
						{grids.map((g) => (
							<View key={g.id} style={{ width }}>
								<SellGrid
									grid={g}
									onSelectProduct={tapProduct}
									onLongPressProduct={openDetail}
								/>
							</View>
						))}
					</ScrollView>
				</>
			)}

			<BasketFab count={itemCount} onPress={() => setBasketOpen(true)} />
			<BasketSheet
				visible={basketOpen}
				onClose={() => setBasketOpen(false)}
				onOpenProduct={setDetailProduct}
				onPaid={handlePaid}
			/>
			<ProductDetailSheet
				product={detailProduct}
				onClose={() => setDetailProduct(null)}
			/>
			{/* A window-level layer above everything (iOS FullWindowOverlay / Android Modal),
			    independent of the basket sheet — so the sheet closes behind it, unseen. */}
			<PaymentSuccessOverlay
				visible={celebrating}
				onHidden={handleHidden}
			/>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safe: { flex: 1, backgroundColor: '#FAF7F2' },
	pager: { flex: 1 },
	title: {
		fontSize: 26,
		fontFamily: FONT.black,
		color: '#A91B3A',
		letterSpacing: 0.3,
		paddingHorizontal: APP_MARGIN,
		// Same margin above and below as the gaps below (carousel ↔ grid, grid bottom).
		paddingTop: APP_MARGIN,
		paddingBottom: APP_MARGIN,
	},
	center: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		padding: 24,
	},
	error: {
		color: '#A91B3A',
		fontSize: 15,
		fontFamily: FONT.regular,
		textAlign: 'center',
	},
});
