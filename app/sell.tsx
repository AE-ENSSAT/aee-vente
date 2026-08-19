import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
	ActivityIndicator,
	type NativeScrollEvent,
	type NativeSyntheticEvent,
	Pressable,
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
import { PaymentSheet } from '@/src/presentation/components/PaymentSheet';
import { PaymentSuccessOverlay } from '@/src/presentation/components/PaymentSuccessOverlay';
import { ProductDetailSheet } from '@/src/presentation/components/ProductDetailSheet';
import { ReceiptPrompt } from '@/src/presentation/components/ReceiptPrompt';
import { SellGrid } from '@/src/presentation/components/SellGrid';
import {
	hapticLongPress,
	hapticRefresh,
	hapticSuccess,
} from '@/src/presentation/haptics';
import { useSellGrids } from '@/src/presentation/sell/useSellGrids';
import { APP_MARGIN, FAB_GAP, FAB_SIZE, FONT } from '@/src/presentation/theme';
import { useBottomSpace } from '@/src/presentation/useBottomSpace';

/** The sell page: grid selector + product grid, with the floating basket + sheet. */
export default function SellScreen() {
	const { grids, loading, error, refreshing, refresh } = useSellGrids();
	const { addProduct, itemCount, clear } = useBasket();
	const { width } = useWindowDimensions();
	const router = useRouter();
	// Enough scroll room for the last row to clear the floating basket button.
	const gridBottomInset = useBottomSpace(FAB_GAP) + FAB_SIZE;
	const pagerRef = useRef<ScrollView>(null);
	const [selectedId, setSelectedId] = useState<string>('');
	const [basketOpen, setBasketOpen] = useState(false);
	const [paymentOpen, setPaymentOpen] = useState(false);
	// While true the flourish covers the app, and the basket empties behind it, unseen.
	const [celebrating, setCelebrating] = useState(false);
	// Kept so the receipt prompt, raised once the flourish fades, can open its detail.
	const [receiptTxId, setReceiptTxId] = useState<string | null>(null);
	const [showReceiptPrompt, setShowReceiptPrompt] = useState(false);
	const [detailProduct, setDetailProduct] = useState<Product | null>(null);

	// A product with variants opens its detail sheet; a plain one goes straight in.
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

	const openDetail = useCallback((product: Product) => {
		hapticLongPress();
		setDetailProduct(product);
	}, []);

	// Buzz the moment the pull fires: on Android the grid doesn't move, so the spinner is
	// the only sign anything happened.
	const reloadGrids = useCallback(() => {
		hapticRefresh();
		refresh();
	}, [refresh]);

	// Pop the flourish first, then — deferred a frame, so the overlay is already up — empty
	// the basket and close the sheet behind it, unseen.
	const handlePaid = useCallback(
		(transactionId: string | null) => {
			hapticSuccess();
			setCelebrating(true);
			setReceiptTxId(transactionId);
			setShowReceiptPrompt(false);
			requestAnimationFrame(() => {
				clear();
				setPaymentOpen(false);
				setBasketOpen(false);
			});
		},
		[clear],
	);

	// The fade has finished onto the cleared screen: retire the flourish, raise the prompt.
	const handleHidden = useCallback(() => {
		setCelebrating(false);
		setShowReceiptPrompt(true);
	}, []);

	// "Oui" — open the sale's detail as a receipt.
	const acceptReceipt = useCallback(() => {
		setShowReceiptPrompt(false);
		if (receiptTxId) {
			router.push({
				pathname: '/transaction/[id]',
				params: { id: receiptTxId, origin: 'receipt' },
			});
		}
	}, [receiptTxId, router]);

	// "Non", or the countdown elapsed.
	const dismissReceipt = useCallback(() => {
		setShowReceiptPrompt(false);
		setReceiptTxId(null);
	}, []);

	const tabs = useMemo(
		() => grids.map((g) => ({ id: g.id, name: g.name })),
		[grids],
	);

	// Default to the first grid once loaded.
	useEffect(() => {
		if (grids.length && !grids.some((g) => g.id === selectedId)) {
			setSelectedId(grids[0].id);
		}
	}, [grids, selectedId]);

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
			<View style={styles.header}>
				<Text style={styles.title}>AEE Vente</Text>
				{/* Account / settings menu: seller profile, transaction history, the
				    Tap to Pay on iPhone help page (req 4.3), and sign out. */}
				<Pressable
					onPress={() => router.push('/settings')}
					style={styles.infoBtn}
					accessibilityRole="button"
					accessibilityLabel="Réglages"
					hitSlop={8}
				>
					<Ionicons
						name="settings-outline"
						size={25}
						color="#A91B3A"
					/>
				</Pressable>
			</View>

			{loading ? (
				<View style={styles.center}>
					<ActivityIndicator />
				</View>
			) : /* An error with a catalogue already on screen came from a pull-to-refresh:
			      keep selling on what we have rather than blanking the till. */
			error && !grids.length ? (
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
									bottomInset={gridBottomInset}
									refreshing={refreshing}
									onRefresh={reloadGrids}
								/>
							</View>
						))}
					</ScrollView>
				</>
			)}

			{/* Hidden while the receipt prompt is up — the two float at the same bottom-right
			    corner, and the basket is empty at that point anyway. */}
			{!showReceiptPrompt && (
				<BasketFab
					count={itemCount}
					onPress={() => setBasketOpen(true)}
				/>
			)}
			<BasketSheet
				visible={basketOpen}
				onClose={() => setBasketOpen(false)}
				onOpenProduct={setDetailProduct}
				onCheckout={() => setPaymentOpen(true)}
			/>
			<PaymentSheet
				visible={paymentOpen}
				onClose={() => setPaymentOpen(false)}
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
			{/* Post-payment: once the flourish has faded, offer a receipt for the sale. */}
			{showReceiptPrompt && receiptTxId && (
				<ReceiptPrompt
					onAccept={acceptReceipt}
					onDismiss={dismissReceipt}
				/>
			)}
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safe: { flex: 1, backgroundColor: '#FAF7F2' },
	pager: { flex: 1 },
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: APP_MARGIN,
		paddingTop: APP_MARGIN,
		paddingBottom: APP_MARGIN,
	},
	title: {
		fontSize: 26,
		fontFamily: FONT.black,
		color: '#A91B3A',
		letterSpacing: 0.3,
	},
	infoBtn: { padding: 4 },
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
