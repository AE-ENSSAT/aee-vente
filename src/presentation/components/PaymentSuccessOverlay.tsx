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

// The checkmark is driven by its `progress` prop (an absolute frame seek), not an imperative
// play() — see CHECK_* below. `progress` is not a native-animated prop, so it is JS-driven
// (useNativeDriver: false); this wrapper makes that explicit.
const AnimatedLottieView = Animated.createAnimatedComponent(LottieView);

// Lottie animation objects; require keeps them typed as `any`, matching LottieView's source.
const CONFETTI = require('../../../assets/lottie/confetti.json');
const CHECKMARK = require('../../../assets/lottie/checkmark.json');

/** How long the bottom message takes to fade in while the check draws. */
const MESSAGE_FADE_IN_MS = 400;

/**
 * The checkmark's "draw" segment (marker "Segment 1"): frames 0 → 100 of the 180-frame, 60fps
 * composition. We drive it by `progress` (0 → 100/180) rather than play(0,100): an absolute
 * frame seek carries NO play-state, so it survives the native view being recycled across
 * payments — imperative play() leaves a frozen layer config (speed 0) that breaks the 3rd play
 * — and shows frame 0 from the very first render (no stale full-checkmark flash on a recycle).
 */
const CHECK_END = 100;
const CHECK_TOTAL_FRAMES = 180;
const CHECK_TARGET = CHECK_END / CHECK_TOTAL_FRAMES;
const CHECK_DURATION_MS = (CHECK_END / 60) * 1000;

/** How long the flourish holds at full opacity before the closing fade begins. Timer-driven
 *  on purpose: Lottie's `onAnimationFinish` is unreliable on Android. */
const HOLD_MS = 1900;

/** The closing fade-out that reveals the (now cleared, sheet-less) sell screen behind it. */
const FADE_OUT_MS = 450;

/**
 * Renders its children ABOVE EVERYTHING — crucially, above the native basket sheet — in a layer
 * that is INDEPENDENT of that sheet. This is the whole trick: because the layer doesn't belong to
 * the sheet's view-controller stack, the basket can be emptied and the sheet dismissed *behind*
 * it with ANY timing and none of it is ever seen.
 *
 * - iOS: react-native-screens `FullWindowOverlay` — a view added straight into the key window,
 *   on top of every presented view controller (incl. the sheet).
 * - Android: a `Modal` — a Dialog in its own window, above the sheet's in-window CoordinatorLayout.
 */
function TopLayer({ children }: { children: ReactNode }) {
	if (Platform.OS === 'ios') {
		return <FullWindowOverlay>{children}</FullWindowOverlay>;
	}
	return (
		<Modal visible transparent statusBarTranslucent animationType="none">
			{children}
		</Modal>
	);
}

interface Props {
	/** Flip to `true` to play the flourish once. */
	visible: boolean;
	/** Fires after the closing fade has finished; hide it (set `visible` false) here. */
	onHidden: () => void;
}

/**
 * Full-screen payment-success flourish — an opaque white screen, a confetti burst, a centered
 * checkmark, and "Paiement accepté !". It pops opaque ON TOP OF EVERYTHING the instant payment
 * succeeds; meanwhile the basket is emptied and the sheet closed behind it (unseen). After a
 * hold the whole thing fades out onto the cleared screen. Drive it with `visible`, react to
 * `onHidden`.
 */
// memo: while celebrating, the sell screen re-renders (the basket empties, the sheet closes)
// — those must NOT re-render this overlay, or the in-flight checkmark Lottie restarts. Its
// props (`visible`, a stable `onHidden`) don't change during a play-through, so memo skips it.
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
	// The checkmark's frame (0 → CHECK_TARGET). Set from the first render, so a recycled
	// native view never flashes its parked last (full) frame.
	const checkProgress = useRef(new Animated.Value(0)).current;
	const messageOpacity = useRef(new Animated.Value(0)).current;
	// The whole overlay's opacity: 1 while covering, animated to 0 for the closing fade.
	const rootOpacity = useRef(new Animated.Value(1)).current;

	// Call the LATEST onHidden, but never let its identity re-run the play-once effect below.
	const onHiddenRef = useRef(onHidden);
	onHiddenRef.current = onHidden;

	// Guard so each Lottie is driven exactly once — a double-invoked effect (StrictMode) would
	// otherwise restart them mid-play.
	const played = useRef(false);

	useEffect(() => {
		if (!played.current) {
			played.current = true;
			// Confetti plays full-range; full play() never pins it to a frame, so it survives
			// recycle. reset() first in case the recycled view is parked on its last frame.
			confetti.current?.reset();
			confetti.current?.play();
			// Checkmark: ramp its progress 0 → CHECK_TARGET. An absolute seek every frame, so
			// no stale play-state can freeze it on the 3rd+ recycled play.
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

		// Hold the flourish, then fade the whole thing out and hand back the cleared screen.
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
	// Fills the host layer (the key-window overlay on iOS, the Modal on Android).
	overlay: {
		...StyleSheet.absoluteFillObject,
		backgroundColor: 'transparent',
	},
	flash: { ...StyleSheet.absoluteFillObject, backgroundColor: '#ffffff' },
	lottie: { ...StyleSheet.absoluteFillObject },
	// Centered over the confetti, in front of it.
	center: {
		...StyleSheet.absoluteFillObject,
		alignItems: 'center',
		justifyContent: 'center',
	},
	checkmark: { width: 200, height: 200 },
	// Occupies the bottom half; centering the text in it lands it midway between the
	// screen centre and the bottom.
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
