import { Ionicons } from '@expo/vector-icons';
import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import type { Product } from '@/src/domain/models';
import {
	basketLineKey,
	useBasket,
} from '@/src/presentation/basket/BasketContext';
import { formatEuros } from '@/src/presentation/money';
import { FONT } from '../theme';
import { useBottomSpace } from '../useBottomSpace';
import { QuantityControls } from './QuantityControls';

interface Props {
	/** The product to detail, or null when the sheet is closed. */
	product: Product | null;
	onClose: () => void;
}

/**
 * Product detail sheet (native true-sheet, `auto` height). Photo + name on top, then either
 * a single quantity block (plain product) or one row per variant — each with its own price
 * and quantity controls — plus a running total. The last shown product is kept rendered
 * through the dismiss animation so the card doesn't blank out as `product` flips to null.
 */
export function ProductDetailSheet({ product, onClose }: Props) {
	const sheet = useRef<TrueSheet>(null);
	const presented = useRef(false);
	const { addProduct, decrement, remove, quantityOf } = useBasket();
	// `insetAdjustment="never"`, so the content clears the system bar itself (see BasketSheet).
	const bottomPad = useBottomSpace(20);

	// Keep the last non-null product so the content survives the dismiss animation.
	const [shown, setShown] = useState<Product | null>(null);

	// Present when a product is set, dismiss when it's cleared. Skipping the initial
	// null avoids dismiss()-ing before the native view registers (see BasketSheet).
	useEffect(() => {
		if (product) {
			setShown(product);
			if (!presented.current) {
				presented.current = true;
				sheet.current?.present();
			}
		} else if (presented.current) {
			presented.current = false;
			sheet.current?.dismiss();
		}
	}, [product]);

	// Dragged/tapped away: clear our flag, then let the parent flip product to null.
	const handleDidDismiss = useCallback(() => {
		presented.current = false;
		onClose();
	}, [onClose]);

	const variants = shown?.variants;
	const quantity = shown ? quantityOf(shown.id) : 0;
	const variantTotal =
		shown && variants
			? variants.reduce(
					(sum, v) => sum + v.price * quantityOf(shown.id, v.id),
					0,
				)
			: 0;

	return (
		<TrueSheet
			ref={sheet}
			detents={['auto']}
			grabber
			backgroundColor="#ffffff"
			insetAdjustment="never"
			onDidDismiss={handleDidDismiss}
		>
			{shown ? (
				<View style={[styles.container, { paddingBottom: bottomPad }]}>
					<Pressable onPress={onClose} style={styles.closeBtn}>
						<Ionicons name="close" size={22} color="#1A1A1A" />
					</Pressable>

					{shown.image ? (
						<Image
							source={{ uri: shown.image }}
							style={styles.photo}
							resizeMode="cover"
						/>
					) : (
						<View
							style={[
								styles.photo,
								styles.placeholder,
								{ backgroundColor: shown.color ?? '#A91B3A' },
							]}
						>
							<Text style={styles.placeholderText}>
								{shown.name.charAt(0).toUpperCase()}
							</Text>
						</View>
					)}

					<Text style={styles.name}>{shown.name}</Text>

					{variants?.length ? (
						<View style={styles.rows}>
							{variants.map((v, idx) => (
								<Fragment key={v.id}>
									{idx > 0 ? (
										<View style={styles.divider} />
									) : null}
									<View style={styles.row}>
										<View style={styles.variantInfo}>
											<Text style={styles.variantName}>
												{v.name}
											</Text>
											<Text style={styles.variantPrice}>
												{formatEuros(v.price)}
											</Text>
										</View>
										<QuantityControls
											quantity={quantityOf(
												shown.id,
												v.id,
											)}
											onIncrement={() =>
												addProduct(shown, v)
											}
											onDecrement={() =>
												decrement(
													basketLineKey(
														shown.id,
														v.id,
													),
												)
											}
											onRemove={() =>
												remove(
													basketLineKey(
														shown.id,
														v.id,
													),
												)
											}
										/>
									</View>
								</Fragment>
							))}

							<View style={styles.divider} />

							<View style={styles.row}>
								<Text style={styles.rowLabel}>Total</Text>
								<Text style={styles.rowTotal}>
									{formatEuros(variantTotal)}
								</Text>
							</View>
						</View>
					) : (
						<View style={styles.rows}>
							<View style={styles.row}>
								<Text style={styles.rowLabel}>
									Prix unitaire
								</Text>
								<Text style={styles.rowValue}>
									{formatEuros(shown.price ?? 0)}
								</Text>
							</View>

							<View style={styles.divider} />

							<View style={styles.row}>
								<Text style={styles.rowLabel}>Quantité</Text>
								<QuantityControls
									quantity={quantity}
									onIncrement={() => addProduct(shown)}
									onDecrement={() => decrement(shown.id)}
									onRemove={() => remove(shown.id)}
								/>
							</View>

							<View style={styles.divider} />

							<View style={styles.row}>
								<Text style={styles.rowLabel}>Total</Text>
								<Text style={styles.rowTotal}>
									{formatEuros((shown.price ?? 0) * quantity)}
								</Text>
							</View>
						</View>
					)}
				</View>
			) : null}
		</TrueSheet>
	);
}

const styles = StyleSheet.create({
	// Uniform margin on every side; the rows below carry no own vertical padding so
	// the top, bottom and side gaps all read the same.
	container: {
		padding: 20,
		alignItems: 'center',
		gap: 16,
	},
	closeBtn: {
		position: 'absolute',
		top: 12,
		right: 12,
		width: 36,
		height: 36,
		borderRadius: 18,
		backgroundColor: '#E5E1DA',
		alignItems: 'center',
		justifyContent: 'center',
		zIndex: 1,
	},
	photo: {
		width: '100%',
		height: 200,
		borderRadius: 16,
	},
	placeholder: {
		alignItems: 'center',
		justifyContent: 'center',
	},
	placeholderText: {
		color: '#ffffff',
		fontSize: 80,
		fontFamily: FONT.black,
	},
	name: {
		fontSize: 24,
		fontFamily: FONT.black,
		color: '#1A1A1A',
		textAlign: 'center',
	},
	// gap spaces the rows from the dividers between them. It adds no leading/trailing
	// space, so the first/last rows stay flush with the container's uniform padding.
	rows: { width: '100%', gap: 8 },
	// Fixed-height rows (no vertical padding) so the first/last rows sit flush with the
	// container's uniform padding — no extra space stacking at the bottom.
	row: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		height: 52,
	},
	rowLabel: { fontSize: 16, fontFamily: FONT.regular, color: '#4A4A4A' },
	rowValue: { fontSize: 16, fontFamily: FONT.regular, color: '#1A1A1A' },
	rowTotal: { fontSize: 20, fontFamily: FONT.bold, color: '#1A1A1A' },
	divider: { height: 1, backgroundColor: '#E5E1DA' },
	variantInfo: { flex: 1, paddingRight: 8 },
	variantName: { fontSize: 16, fontFamily: FONT.regular, color: '#1A1A1A' },
	variantPrice: {
		fontSize: 13,
		fontFamily: FONT.regular,
		color: '#4A4A4A',
		marginTop: 2,
	},
});
