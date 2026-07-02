import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { FONT } from '../theme';

interface Props {
	/** The message to show, or null to hide the banner. */
	message: string | null;
	onDismiss: () => void;
}

/** Auto-hide the banner after this delay; the user can also tap to dismiss sooner. */
const AUTO_DISMISS_MS = 4000;

/**
 * A soft red banner that slides up to announce a refused/failed payment, then fades away
 * on its own after a few seconds (or on tap). Lives above the pay buttons so the basket
 * stays open and the user can simply try again. Renders nothing when there's no message.
 */
export function PaymentErrorBanner({ message, onDismiss }: Props) {
	useEffect(() => {
		if (!message) {
			return;
		}
		const timer = setTimeout(onDismiss, AUTO_DISMISS_MS);
		return () => clearTimeout(timer);
	}, [message, onDismiss]);

	if (!message) {
		return null;
	}

	return (
		<Animated.View
			entering={FadeInDown.duration(250)}
			exiting={FadeOutDown.duration(200)}
		>
			<Pressable style={styles.banner} onPress={onDismiss}>
				<Ionicons name="close-circle" size={22} color="#ffffff" />
				<Text style={styles.text}>{message}</Text>
			</Pressable>
		</Animated.View>
	);
}

const styles = StyleSheet.create({
	// Bordeaux fill with white text — the brand rule for small text on bordeaux.
	banner: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 10,
		backgroundColor: '#A91B3A',
		borderRadius: 12,
		paddingHorizontal: 14,
		paddingVertical: 12,
	},
	text: { flex: 1, color: '#ffffff', fontSize: 15, fontFamily: FONT.bold },
});
