import { Ionicons } from '@expo/vector-icons';
import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
	Alert,
	type LayoutChangeEvent,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	View,
} from 'react-native';
import type { BasketItem, Product } from '@/src/domain/models';
import {
	basketLineKey,
	linePrice,
	useBasket,
} from '@/src/presentation/basket/BasketContext';
import { formatEuros } from '@/src/presentation/money';
import { BOTTOM_GAP, FONT } from '../theme';
import { useBottomSpace } from '../useBottomSpace';
import { PayButtons } from './PayButtons';

interface Props {
	visible: boolean;
	onClose: () => void;
	/** Tap a line to open that product's detail sheet. */
	onOpenProduct: (product: Product) => void;
	/** Fired the instant a payment succeeds, so the screen can start the success flourish. */
	onPaid?: () => void;
}

/** Equal breathing room at the top and bottom of the product list. */
const GAP = 16;

/** Outer gap between the sheet's cards and the screen's rounded edge. */
const CARD_INSET = 3;

/** Force the scroll view's insets to zero so margins don't shift while scrolling. */
const ZERO_INSETS = { top: 0, bottom: 0, left: 0, right: 0 } as const;

/**
 * Basket sheet backed by the native OS sheet (react-native-true-sheet). Two detents:
 * 0.7 by default, full screen when dragged up. The title (header) and Total/pay-buttons
 * (footer) are pinned; only the list scrolls. The footer floats over the scroll, so the
 * list reserves its height + GAP at the bottom to sit a GAP above it.
 */
export function BasketSheet({
	visible,
	onClose,
	onOpenProduct,
	onPaid,
}: Props) {
	const sheet = useRef<TrueSheet>(null);
	const presented = useRef(false);
	const { items, totalCents, itemCount, clear } = useBasket();
	// The sheet opts out of true-sheet's auto safe-area (`insetAdjustment="never"`), so the
	// footer clears the system bar itself. Reading the inset here in the host is robust —
	// the host is under the app-root SafeAreaProvider even though the sheet renders in a
	// separate window on Android.
	const footerBottom = useBottomSpace(BOTTOM_GAP);

	const confirmClear = useCallback(() => {
		Alert.alert(
			'Vider le panier',
			'Voulez-vous vraiment vider le panier ?',
			[
				{ text: 'Annuler', style: 'cancel' },
				{ text: 'Vider', style: 'destructive', onPress: clear },
			],
		);
	}, [clear]);

	// The footer floats over the scroll content, so reserve its height (plus a GAP) at
	// the bottom of the list — that puts the last row a GAP above the footer.
	const [footerHeight, setFooterHeight] = useState(0);
	const onFooterLayout = useCallback((e: LayoutChangeEvent) => {
		setFooterHeight(e.nativeEvent.layout.height);
	}, []);

	// Act only on real visible transitions. Skipping the initial false avoids
	// dismiss()-ing before the native view registers ("No sheet found with tag").
	useEffect(() => {
		if (visible && !presented.current) {
			presented.current = true;
			sheet.current?.present();
		} else if (!visible && presented.current) {
			presented.current = false;
			sheet.current?.dismiss();
		}
	}, [visible]);

	// The native sheet was dragged/closed: clear our flag so we don't re-dismiss,
	// then let the parent flip `visible` to false.
	const handleDidDismiss = useCallback(() => {
		presented.current = false;
		onClose();
	}, [onClose]);

	return (
		<TrueSheet
			ref={sheet}
			detents={[0.7, 1]}
			insetAdjustment="never"
			grabber
			scrollable
			backgroundColor="#ffffff"
			onDidDismiss={handleDidDismiss}
			header={
				<View style={styles.header}>
					<Pressable
						onPress={confirmClear}
						disabled={itemCount === 0}
						style={[
							styles.clearBtn,
							itemCount === 0 && styles.btnDisabled,
						]}
					>
						<Ionicons name="trash" size={20} color="#ffffff" />
					</Pressable>
					<Text style={styles.title}>Panier</Text>
					<Pressable onPress={onClose} style={styles.closeBtn}>
						<Ionicons name="close" size={22} color="#1A1A1A" />
					</Pressable>
				</View>
			}
			footer={
				<View
					style={[styles.footer, { paddingBottom: footerBottom }]}
					onLayout={onFooterLayout}
				>
					<View style={styles.totalRow}>
						<Text style={styles.totalLabel}>Total</Text>
						<Text style={styles.totalValue}>
							{formatEuros(totalCents)}
						</Text>
					</View>
					<PayButtons onPaymentSuccess={onPaid} />
				</View>
			}
		>
			<ScrollView
				style={styles.list}
				contentContainerStyle={[
					styles.listContent,
					// Reserve the floating footer's height plus a GAP. The footer
					// is pinned flush to the sheet bottom (no vertical margin), so
					// the last row lands exactly GAP above it — matching the top.
					{ paddingBottom: footerHeight + GAP },
				]}
				contentInsetAdjustmentBehavior="never"
				automaticallyAdjustsScrollIndicatorInsets={false}
				contentInset={ZERO_INSETS}
				scrollIndicatorInsets={ZERO_INSETS}
				showsVerticalScrollIndicator={false}
			>
				<View style={styles.itemsWrap}>
					{items.length === 0 ? (
						<Text style={styles.empty}>Votre panier est vide.</Text>
					) : (
						items.map((item) => (
							<BasketRow
								key={basketLineKey(
									item.product.id,
									item.variant?.id ?? null,
								)}
								item={item}
								onOpen={onOpenProduct}
							/>
						))
					)}
				</View>
			</ScrollView>
		</TrueSheet>
	);
}

interface BasketRowProps {
	item: BasketItem;
	onOpen: (product: Product) => void;
}

/**
 * A single basket line: quantity then product (and variant) name on the left, the line
 * sub-total on the right. Tapping the row opens the product's detail sheet (where quantity
 * is edited). The variant, when present, sets both the displayed name and the unit price.
 */
function BasketRow({ item, onOpen }: BasketRowProps) {
	const name = item.variant
		? `${item.product.name} – ${item.variant.name}`
		: item.product.name;
	return (
		<Pressable
			onPress={() => onOpen(item.product)}
			style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
		>
			<View style={styles.left}>
				<Text style={styles.qty}>{item.quantity}</Text>
				<Text style={styles.name} numberOfLines={1}>
					{name}
				</Text>
			</View>
			<Text style={styles.lineTotal}>
				{formatEuros(linePrice(item) * item.quantity)}
			</Text>
		</Pressable>
	);
}

const styles = StyleSheet.create({
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: 18,
		// Outer gap from the card's rounded edge (sides + top).
		marginHorizontal: CARD_INSET,
		marginTop: CARD_INSET,
		// Top margin also clears the native grabber; bottom margin spaces the
		// title from the divider below.
		paddingTop: 24,
		paddingBottom: 20,
		// Divider so the title reads as separate from the list.
		borderBottomWidth: 1,
		borderBottomColor: '#E5E1DA',
	},
	title: {
		flex: 1,
		textAlign: 'center',
		fontSize: 22,
		fontFamily: FONT.black,
		color: '#A91B3A',
		textTransform: 'uppercase',
		letterSpacing: 0.3,
	},
	clearBtn: {
		width: 36,
		height: 36,
		borderRadius: 18,
		backgroundColor: '#A91B3A',
		alignItems: 'center',
		justifyContent: 'center',
	},
	closeBtn: {
		width: 36,
		height: 36,
		borderRadius: 18,
		backgroundColor: '#E5E1DA',
		alignItems: 'center',
		justifyContent: 'center',
	},
	btnDisabled: { opacity: 0.4 },
	empty: {
		textAlign: 'center',
		color: '#4A4A4A',
		fontSize: 15,
		fontFamily: FONT.regular,
		paddingVertical: 32,
	},
	list: { marginHorizontal: CARD_INSET },
	// Top-aligned with a constant GAP; the dynamic paddingBottom (footer height +
	// GAP) clears the floating footer. When the sheet hugs the content both ends are
	// exactly GAP; only a sub-MIN basket leaves extra room, which falls to the bottom.
	listContent: { paddingTop: GAP },
	itemsWrap: { gap: 12, paddingHorizontal: 18 },
	// Tappable white card; opens the product detail sheet.
	row: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
		backgroundColor: '#ffffff',
		borderWidth: 1,
		borderColor: '#E5E1DA',
		borderRadius: 14,
		paddingHorizontal: 14,
		paddingVertical: 14,
	},
	rowPressed: { opacity: 0.6 },
	left: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
	// Quantity chip sitting before the name.
	qty: {
		minWidth: 30,
		textAlign: 'center',
		fontSize: 15,
		fontFamily: FONT.bold,
		color: '#1A1A1A',
		backgroundColor: '#E5E1DA',
		borderRadius: 8,
		paddingHorizontal: 8,
		paddingVertical: 4,
		overflow: 'hidden',
	},
	name: { flex: 1, fontSize: 16, fontFamily: FONT.regular, color: '#1A1A1A' },
	lineTotal: { fontSize: 16, fontFamily: FONT.bold, color: '#1A1A1A' },
	footer: {
		gap: 12,
		paddingHorizontal: 18,
		paddingTop: 12,
		// Flush to the sheet bottom (no marginBottom) so the list's bottom gap is a clean
		// footerHeight + GAP. paddingBottom is applied dynamically (insets.bottom + BOTTOM_GAP)
		// so the bottom pay button clears the Android nav bar / iOS home indicator.
		backgroundColor: '#ffffff',
		// Outer gap from the card's rounded edge (sides only).
		marginHorizontal: CARD_INSET,
		// Full-width divider matching the header bar.
		borderTopWidth: 1,
		borderTopColor: '#E5E1DA',
	},
	totalRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	totalLabel: { fontSize: 18, fontFamily: FONT.bold, color: '#1A1A1A' },
	totalValue: { fontSize: 22, fontFamily: FONT.bold, color: '#1A1A1A' },
});
