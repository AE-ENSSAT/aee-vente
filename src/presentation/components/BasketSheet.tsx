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
import { BOTTOM_GAP, FONT, SCREEN_TITLE } from '../theme';
import { useBottomSpace } from '../useBottomSpace';
import { PrimaryButton } from './PrimaryButton';

interface Props {
	visible: boolean;
	onClose: () => void;
	/** Tap a line to open that product's detail sheet. */
	onOpenProduct: (product: Product) => void;
	/** The "Paiement" button; only reachable with a non-empty basket. */
	onCheckout: () => void;
}

const GAP = 16;

/** Outer gap between the sheet's cards and the screen's rounded edge. */
const CARD_INSET = 3;

const ZERO_INSETS = { top: 0, bottom: 0, left: 0, right: 0 } as const;

/**
 * Basket sheet on the native OS sheet (react-native-true-sheet), detents 0.7 and full.
 * Header and footer are pinned; only the list scrolls, under a floating footer.
 */
export function BasketSheet({
	visible,
	onClose,
	onOpenProduct,
	onCheckout,
}: Props) {
	const sheet = useRef<TrueSheet>(null);
	const presented = useRef(false);
	const { items, totalCents, itemCount, clear } = useBasket();
	// The sheet opts out of true-sheet's auto safe-area, so the footer clears the system bar
	// itself. Read in the host, which is under the app-root SafeAreaProvider — on Android the
	// sheet itself renders in a separate window.
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

	// The footer floats over the scroll content, so the list reserves its height.
	const [footerHeight, setFooterHeight] = useState(0);
	const onFooterLayout = useCallback((e: LayoutChangeEvent) => {
		setFooterHeight(e.nativeEvent.layout.height);
	}, []);

	// Skipping the initial false avoids dismiss()-ing before the native view registers
	// ("No sheet found with tag").
	useEffect(() => {
		if (visible && !presented.current) {
			presented.current = true;
			sheet.current?.present();
		} else if (!visible && presented.current) {
			presented.current = false;
			sheet.current?.dismiss();
		}
	}, [visible]);

	// Dragged closed natively: clear the flag so we don't re-dismiss.
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
					{/* One entry point: opens the payment page (method choice). Disabled on an
					    empty basket — there's no sale to start, so the Tap to Pay button (never
					    shown disabled, Apple req 5.3) simply isn't presented yet. */}
					<PrimaryButton
						label="Paiement"
						variant="primary"
						disabled={itemCount === 0}
						onPress={onCheckout}
						icon={
							<Ionicons
								name="card-outline"
								size={20}
								color="#ffffff"
							/>
						}
					/>
				</View>
			}
		>
			<ScrollView
				style={styles.list}
				contentContainerStyle={[
					styles.listContent,
					// The footer is pinned flush to the sheet bottom, so this lands the
					// last row exactly GAP above it — matching the top.
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
 * One basket line: quantity and name left, sub-total right. Tapping it opens the product's
 * detail sheet, where the quantity is edited. A variant sets both the name and the price.
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
		marginHorizontal: CARD_INSET,
		marginTop: CARD_INSET,
		// Top padding also clears the native grabber.
		paddingTop: 24,
		paddingBottom: 20,
		borderBottomWidth: 1,
		borderBottomColor: '#E5E1DA',
	},
	title: SCREEN_TITLE,
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
	// Top gap is constant; the dynamic paddingBottom (footer height + GAP) clears the
	// floating footer, so both ends read as GAP.
	listContent: { paddingTop: GAP },
	itemsWrap: { gap: 12, paddingHorizontal: 18 },
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
		// Flush to the sheet bottom, so the list's bottom gap is a clean footerHeight + GAP.
		// paddingBottom is dynamic, clearing the Android nav bar / iOS home indicator.
		backgroundColor: '#ffffff',
		marginHorizontal: CARD_INSET,
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
