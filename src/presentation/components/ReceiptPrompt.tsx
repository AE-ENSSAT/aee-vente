import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
	Easing,
	FadeInDown,
	FadeOutDown,
	useAnimatedStyle,
	useSharedValue,
	withTiming,
} from 'react-native-reanimated';
import { APP_MARGIN, BOTTOM_GAP, FONT } from '../theme';
import { useBottomSpace } from '../useBottomSpace';

/** How long the prompt stays up before it auto-dismisses (the bar depletes over this). */
const DURATION_MS = 3000;

interface Props {
	/** "Oui" — open the receipt (transaction detail). */
	onAccept: () => void;
	/** "Non", or the countdown elapsed — dismiss without offering a receipt. */
	onDismiss: () => void;
}

/**
 * A floating bottom card shown once the payment-success flourish has faded, asking whether
 * the customer wants a receipt. A red progress bar fills left-to-right over {@link
 * DURATION_MS}; when it completes (or on "Non") the prompt auto-dismisses, while "Oui" opens
 * the transaction detail.
 */
export function ReceiptPrompt({ onAccept, onDismiss }: Props) {
	// 0 → 1 over the countdown; drives the red bar's width on the UI thread (it fills up).
	const progress = useSharedValue(0);
	const bottom = useBottomSpace(BOTTOM_GAP);

	useEffect(() => {
		progress.value = withTiming(1, {
			duration: DURATION_MS,
			easing: Easing.linear,
		});
		// The auto-dismiss is a plain JS timer, decoupled from the animation, so it fires
		// exactly once — the same pattern as PaymentErrorBanner.
		const timer = setTimeout(onDismiss, DURATION_MS);
		return () => clearTimeout(timer);
	}, [onDismiss, progress]);

	const barStyle = useAnimatedStyle(() => ({
		width: `${progress.value * 100}%`,
	}));

	return (
		<Animated.View
			entering={FadeInDown.duration(250)}
			exiting={FadeOutDown.duration(200)}
			style={[styles.wrap, { bottom }]}
		>
			<View style={styles.card}>
				<View style={styles.track}>
					<Animated.View style={[styles.fill, barStyle]} />
				</View>
				<View style={styles.body}>
					<View style={styles.question}>
						<Ionicons
							name="receipt-outline"
							size={22}
							color="#A91B3A"
						/>
						<Text style={styles.questionText}>
							Voulez-vous un reçu ?
						</Text>
					</View>
					<View style={styles.actions}>
						<Pressable
							onPress={onDismiss}
							style={({ pressed }) => [
								styles.btn,
								styles.btnNo,
								pressed && styles.pressed,
							]}
							accessibilityRole="button"
							accessibilityLabel="Non"
						>
							<Text style={styles.btnNoLabel}>Non</Text>
						</Pressable>
						<Pressable
							onPress={onAccept}
							style={({ pressed }) => [
								styles.btn,
								styles.btnYes,
								pressed && styles.pressed,
							]}
							accessibilityRole="button"
							accessibilityLabel="Oui"
						>
							<Text style={styles.btnYesLabel}>Oui</Text>
						</Pressable>
					</View>
				</View>
			</View>
		</Animated.View>
	);
}

const styles = StyleSheet.create({
	wrap: {
		position: 'absolute',
		left: APP_MARGIN,
		right: APP_MARGIN,
	},
	// White card with the same floating shadow as the basket FAB.
	card: {
		backgroundColor: '#ffffff',
		borderRadius: 16,
		borderWidth: 1,
		borderColor: '#E5E1DA',
		overflow: 'hidden',
		elevation: 6,
		shadowColor: '#000000',
		shadowOpacity: 0.25,
		shadowRadius: 6,
		shadowOffset: { width: 0, height: 3 },
	},
	// Progress bar pinned along the card's top edge: a grey track with a red fill anchored to
	// the left, whose width grows 0 → 100% so the red sweeps in left-to-right over the countdown.
	track: { height: 4, backgroundColor: '#E5E1DA' },
	fill: { height: 4, backgroundColor: '#A91B3A' },
	body: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		gap: 12,
		paddingHorizontal: 16,
		paddingVertical: 14,
	},
	question: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		gap: 10,
	},
	questionText: {
		flex: 1,
		fontSize: 16,
		fontFamily: FONT.bold,
		color: '#1A1A1A',
	},
	actions: { flexDirection: 'row', gap: 8 },
	btn: {
		minWidth: 56,
		alignItems: 'center',
		justifyContent: 'center',
		borderRadius: 10,
		paddingHorizontal: 16,
		paddingVertical: 10,
	},
	btnNo: { backgroundColor: '#E5E1DA' },
	btnNoLabel: { fontSize: 15, fontFamily: FONT.bold, color: '#1A1A1A' },
	btnYes: { backgroundColor: '#A91B3A' },
	btnYesLabel: { fontSize: 15, fontFamily: FONT.bold, color: '#ffffff' },
	pressed: { opacity: 0.85 },
});
