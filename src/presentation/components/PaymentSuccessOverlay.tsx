import LottieView from 'lottie-react-native';
import { memo, type ReactNode, useEffect, useRef } from 'react';
import {
	Animated,
	Easing,
	Modal,
	Platform,
	StyleSheet,
	Text,
	View,
} from 'react-native';
import { FullWindowOverlay } from 'react-native-screens';
import { FONT } from '../theme';

// `progress` is not a native-animated prop, so this wrapper is JS-driven (see CHECK_END).
const AnimatedLottieView = Animated.createAnimatedComponent(LottieView);

const CONFETTI = require('../../../assets/lottie/confetti.json');
const CHECKMARK = require('../../../assets/lottie/checkmark.json');

const MESSAGE_FADE_IN_MS = 400;

/**
 * The checkmark's draw segment: frames 0 → 100 of 180. Driven by `progress` (an absolute
 * seek) rather than play(), which carries no play-state and so survives the native view
 * being recycled across payments — play() leaves it frozen on the third play.
 */
const CHECK_END = 100;
const CHECK_TOTAL_FRAMES = 180;
const CHECK_TARGET = CHECK_END / CHECK_TOTAL_FRAMES;
const CHECK_DURATION_MS = (CHECK_END / 60) * 1000;

/** Timer-driven on purpose: Lottie's `onAnimationFinish` is unreliable on Android. */
const HOLD_MS = 1900;

const FADE_OUT_MS = 450;

/**
 * Renders children above everything in a layer INDEPENDENT of the basket sheet — which is
 * what lets the sheet dismiss behind it unseen. iOS: `FullWindowOverlay` (key window);
 * Android: a `Modal` (its own window, above the sheet's CoordinatorLayout).
 */
function TopLayer({ children }: { children: ReactNode }) {
	if (Platform.OS === 'ios') {
		return <FullWindowOverlay>{children}</FullWindowOverlay>;
	}
	return (
		// Translucent bars, so the flourish covers under both on Android edge-to-edge.
		<Modal
			visible
			transparent
			statusBarTranslucent
			navigationBarTranslucent
			animationType="none"
		>
			{children}
		</Modal>
	);
}

interface Props {
	visible: boolean;
	onHidden: () => void;
}

/**
 * Full-screen payment-success flourish, opaque and above everything, so the basket can be
 * emptied and its sheet dismissed behind it unseen. `onHidden` fires after the closing fade.
 */
// memo: the sell screen re-renders while this plays (basket empties, sheet closes), and
// that must not restart the in-flight checkmark.
export const PaymentSuccessOverlay = memo(function PaymentSuccessOverlay({
	visible,
	onHidden,
}: Props) {
	// Mounted fresh on each show → a guaranteed clean replay (and reset fade) every time.
	if (!visible) {
		return null;
	}
	return (
		<TopLayer>
			<Burst onHidden={onHidden} />
		</TopLayer>
	);
});

/** One play-through of the flourish. Mounted only while visible, so it just runs on mount. */
function Burst({ onHidden }: { onHidden: () => void }) {
	const confetti = useRef<LottieView>(null);
	// Set from the first render, so a recycled view never flashes its parked last frame.
	const checkProgress = useRef(new Animated.Value(0)).current;
	const messageOpacity = useRef(new Animated.Value(0)).current;
	const rootOpacity = useRef(new Animated.Value(1)).current;

	// Call the LATEST onHidden, but never let its identity re-run the play-once effect below.
	const onHiddenRef = useRef(onHidden);
	onHiddenRef.current = onHidden;

	// Play exactly once — a double-invoked effect (StrictMode) would restart mid-play.
	const played = useRef(false);

	useEffect(() => {
		if (!played.current) {
			played.current = true;
			// reset() first: a recycled view may be parked on its last frame.
			confetti.current?.reset();
			confetti.current?.play();
			// An absolute seek every frame, so no stale play-state can freeze a recycled view.
			Animated.timing(checkProgress, {
				toValue: CHECK_TARGET,
				duration: CHECK_DURATION_MS,
				easing: Easing.linear,
				useNativeDriver: false,
			}).start();
		}
		Animated.timing(messageOpacity, {
			toValue: 1,
			duration: MESSAGE_FADE_IN_MS,
			useNativeDriver: true,
		}).start();

		// Hold, then fade out onto the cleared screen.
		const hold = setTimeout(() => {
			Animated.timing(rootOpacity, {
				toValue: 0,
				duration: FADE_OUT_MS,
				useNativeDriver: true,
			}).start(({ finished }) => {
				if (finished) {
					onHiddenRef.current();
				}
			});
		}, HOLD_MS);

		return () => clearTimeout(hold);
	}, [messageOpacity, rootOpacity, checkProgress]);

	return (
		<Animated.View style={[styles.overlay, { opacity: rootOpacity }]}>
			{/* Opaque white backdrop — fades as one with everything else at the end. */}
			<View style={styles.flash} />
			<LottieView
				ref={confetti}
				source={CONFETTI}
				loop={false}
				resizeMode="cover"
				style={styles.lottie}
			/>
			<View style={styles.center}>
				<AnimatedLottieView
					source={CHECKMARK}
					loop={false}
					resizeMode="contain"
					style={styles.checkmark}
					progress={checkProgress}
				/>
			</View>
			{/* Lower half of the screen → text sits centered at the 75% line. */}
			<Animated.View
				style={[styles.messageWrap, { opacity: messageOpacity }]}
			>
				<Text style={styles.message}>Paiement accepté !</Text>
			</Animated.View>
		</Animated.View>
	);
}

const styles = StyleSheet.create({
	overlay: {
		...StyleSheet.absoluteFill,
		backgroundColor: 'transparent',
	},
	flash: { ...StyleSheet.absoluteFill, backgroundColor: '#ffffff' },
	lottie: { ...StyleSheet.absoluteFill },
	center: {
		...StyleSheet.absoluteFill,
		alignItems: 'center',
		justifyContent: 'center',
	},
	checkmark: { width: 200, height: 200 },
	// Bottom half; centring the text in it lands it between the screen centre and the bottom.
	messageWrap: {
		position: 'absolute',
		top: '50%',
		left: 0,
		right: 0,
		bottom: 0,
		alignItems: 'center',
		justifyContent: 'center',
	},
	message: {
		fontSize: 24,
		fontFamily: FONT.black,
		color: '#1A1A1A',
		textAlign: 'center',
	},
});
