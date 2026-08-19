import { Ionicons } from '@expo/vector-icons';
import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, {
	LayoutAnimationConfig,
	SlideInLeft,
	SlideInRight,
	SlideOutLeft,
	SlideOutRight,
} from 'react-native-reanimated';
import { useBasket } from '@/src/presentation/basket/BasketContext';
import { useCheckout } from '@/src/presentation/checkout/useCheckout';
import { usePaymentMethods } from '@/src/presentation/checkout/usePaymentMethods';
import { formatEuros } from '@/src/presentation/money';
import type { PaymentMethod } from '@/src/services/PaymentService';
import { BOTTOM_GAP, FONT } from '../theme';
import { useBottomSpace } from '../useBottomSpace';
import { PayButtons } from './PayButtons';
import { PrimaryButton } from './PrimaryButton';

interface Props {
	visible: boolean;
	onClose: () => void;
	/** Fired the instant a payment succeeds, so the sell screen can start the success flourish
	 *  (which closes this sheet and the basket behind it). Carries the sale's id, or null when
	 *  it wasn't persisted. */
	onPaid?: (transactionId: string | null) => void;
}

/** Side gutter for the page body — a touch tighter than the app margin so the full-width
 *  buttons breathe without feeling boxed in. */
const PAGE_PADDING = 24;

/** The page's two views: pick a method, or confirm a cash sale. */
type Mode = 'methods' | 'cash';

/** Duration of the horizontal push/pop between the two views. */
const SLIDE_MS = 220;

/**
 * The "Paiement" page: a full-screen native sheet (react-native-true-sheet, single detent 1)
 * that slides up from the bottom over the open basket — the same rise as the post-payment
 * receipt. The header pins the total (a reminder of what's being charged); the body is either
 * the method chooser ({@link PayButtons}) or the cash-confirmation step.
 *
 * Card methods confirm themselves through SumUp's native UI, so they charge immediately. Cash
 * has no such UI, so tapping "Espèces" opens an explicit confirm view (`mode: 'cash'`) before
 * the sale is recorded. The checkout hook lives here (not in PayButtons) so both the card
 * buttons and the cash confirm drive the one flow.
 *
 * It stacks over the basket sheet (a proven pattern here — the product detail sheet does the
 * same), so SumUp's native payment UI still presents above it (it targets the top-most presented
 * view controller), and cancelling drops straight back to the basket. On success the sell
 * screen's flourish covers it while it and the basket are dismissed behind it, unseen.
 */
export function PaymentSheet({ visible, onClose, onPaid }: Props) {
	const sheet = useRef<TrueSheet>(null);
	const presented = useRef(false);
	const { totalCents } = useBasket();
	const { checkout, busy, pendingMethod, error, dismissError } =
		useCheckout(onPaid);
	// Which rails this association actually takes — the cash-only ones show no card buttons.
	const enabledMethods = usePaymentMethods();
	const [mode, setMode] = useState<Mode>('methods');
	// Opts out of true-sheet's auto safe-area (`insetAdjustment="never"`), so the last button
	// clears the system bar itself — same as the basket sheet.
	const bottomPad = useBottomSpace(BOTTOM_GAP);

	// Act only on real visible transitions. Skipping the initial false avoids dismiss()-ing
	// before the native view registers ("No sheet found with tag"). Mirrors BasketSheet.
	useEffect(() => {
		if (visible && !presented.current) {
			presented.current = true;
			sheet.current?.present();
		} else if (!visible && presented.current) {
			presented.current = false;
			sheet.current?.dismiss();
		}
	}, [visible]);

	// Dragged/closed natively: clear our flag + any stale error and reset to the method chooser
	// (so the next open starts fresh — done here, off-screen, so reopening never animates), then
	// let the parent flip `visible` to false.
	const handleDidDismiss = useCallback(() => {
		presented.current = false;
		dismissError();
		setMode('methods');
		onClose();
	}, [onClose, dismissError]);

	// Ignore stray taps during the async window before SumUp's native UI covers the sheet, so a
	// second card method can't be launched over an in-flight one.
	const payCard = useCallback(
		(method: PaymentMethod) => {
			if (busy) {
				return;
			}
			checkout(method);
		},
		[busy, checkout],
	);

	// Espèces: a no-op while a card attempt is in flight (its busy/error must not bleed into the
	// confirm view, which shows no error banner). Otherwise clear any card error and confirm.
	const selectCash = useCallback(() => {
		if (busy) {
			return;
		}
		dismissError();
		setMode('cash');
	}, [busy, dismissError]);

	const inCash = mode === 'cash';

	return (
		<TrueSheet
			ref={sheet}
			detents={[1]}
			insetAdjustment="never"
			grabber
			scrollable
			backgroundColor="#FAF7F2"
			onDidDismiss={handleDidDismiss}
			header={
				<View style={styles.header}>
					<View style={styles.headerBar}>
						{inCash ? (
							<Pressable
								onPress={() => setMode('methods')}
								disabled={busy}
								style={[
									styles.headerSide,
									busy && styles.btnDisabled,
								]}
								accessibilityRole="button"
								accessibilityLabel="Retour"
								hitSlop={8}
							>
								<Ionicons
									name="chevron-back"
									size={26}
									color="#1A1A1A"
								/>
							</Pressable>
						) : (
							<View style={styles.headerSide} />
						)}
						<Text style={styles.title}>
							{inCash ? 'Espèces' : 'Paiement'}
						</Text>
						<Pressable
							onPress={onClose}
							disabled={busy}
							style={[
								styles.closeBtn,
								busy && styles.btnDisabled,
							]}
							accessibilityRole="button"
							accessibilityLabel="Fermer"
							hitSlop={8}
						>
							<Ionicons name="close" size={22} color="#1A1A1A" />
						</Pressable>
					</View>
					{/* The total, front and centre — a reminder of what's being charged. */}
					<View style={styles.totalBlock}>
						<Text style={styles.totalLabel}>Total</Text>
						<Text style={styles.totalValue}>
							{formatEuros(totalCents)}
						</Text>
					</View>
				</View>
			}
		>
			<ScrollView
				contentContainerStyle={[
					styles.content,
					{ paddingBottom: bottomPad },
				]}
				showsVerticalScrollIndicator={false}
			>
				{/* Push/pop the two views horizontally: the confirm page slides in from the
				    right (forward), the method list slides back in from the left (back). Wrapped
				    in LayoutAnimationConfig so the very first render doesn't animate. */}
				<LayoutAnimationConfig skipEntering>
					{inCash ? (
						<Animated.View
							key="cash"
							entering={SlideInRight.duration(SLIDE_MS)}
							exiting={SlideOutRight.duration(SLIDE_MS)}
						>
							<CashConfirm
								total={totalCents}
								busy={busy}
								onConfirm={() => checkout('cash')}
								onCancel={() => setMode('methods')}
							/>
						</Animated.View>
					) : (
						<Animated.View
							key="methods"
							entering={SlideInLeft.duration(SLIDE_MS)}
							exiting={SlideOutLeft.duration(SLIDE_MS)}
						>
							<PayButtons
								enabledMethods={enabledMethods}
								pendingMethod={pendingMethod}
								error={error}
								onDismissError={dismissError}
								onPayCard={payCard}
								onSelectCash={selectCash}
							/>
						</Animated.View>
					)}
				</LayoutAnimationConfig>
			</ScrollView>
		</TrueSheet>
	);
}

interface CashConfirmProps {
	total: number;
	busy: boolean;
	onConfirm: () => void;
	onCancel: () => void;
}

/** The cash confirmation step: no card UI stands in for the merchant taking the notes, so this
 *  makes them confirm the amount before the sale is recorded. */
function CashConfirm({ total, busy, onConfirm, onCancel }: CashConfirmProps) {
	return (
		<View style={styles.confirm}>
			<View style={styles.cashBadge}>
				<Ionicons name="cash-outline" size={40} color="#16875A" />
			</View>
			<Text style={styles.confirmText}>
				Confirmez la réception de {formatEuros(total)} en espèces.
			</Text>
			<View style={styles.confirmActions}>
				<PrimaryButton
					label="Confirmer l'encaissement"
					variant="success"
					loading={busy}
					onPress={onConfirm}
					icon={
						<Ionicons name="checkmark" size={20} color="#ffffff" />
					}
				/>
				<PrimaryButton
					label="Annuler"
					variant="tertiary"
					disabled={busy}
					onPress={onCancel}
				/>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	header: {
		backgroundColor: '#FAF7F2',
		paddingBottom: 22,
		borderBottomWidth: 1,
		borderBottomColor: '#E5E1DA',
	},
	headerBar: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: 18,
		// Clears the native grabber above the title bar.
		paddingTop: 24,
	},
	// Fixed footprint on each side so the title stays optically centred (holds the back
	// chevron in cash mode, empty otherwise / the close button opposite).
	headerSide: {
		width: 36,
		height: 36,
		alignItems: 'center',
		justifyContent: 'center',
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
	closeBtn: {
		width: 36,
		height: 36,
		borderRadius: 18,
		backgroundColor: '#E5E1DA',
		alignItems: 'center',
		justifyContent: 'center',
	},
	// Header back/close while a payment is committing — matches the disabled "Annuler".
	btnDisabled: { opacity: 0.4 },
	totalBlock: { alignItems: 'center', gap: 6, paddingTop: 20 },
	totalLabel: {
		fontSize: 15,
		fontFamily: FONT.bold,
		color: '#767676',
		textTransform: 'uppercase',
		letterSpacing: 0.6,
	},
	totalValue: { fontSize: 40, fontFamily: FONT.black, color: '#1A1A1A' },
	content: {
		paddingHorizontal: PAGE_PADDING,
		paddingTop: 28,
	},
	confirm: { alignItems: 'center', gap: 20, paddingTop: 12 },
	cashBadge: {
		width: 84,
		height: 84,
		borderRadius: 42,
		backgroundColor: '#E4F4EC',
		alignItems: 'center',
		justifyContent: 'center',
	},
	confirmText: {
		fontSize: 17,
		fontFamily: FONT.regular,
		color: '#1A1A1A',
		textAlign: 'center',
		lineHeight: 24,
		paddingHorizontal: 8,
	},
	confirmActions: { width: '100%', gap: 10, paddingTop: 4 },
});
