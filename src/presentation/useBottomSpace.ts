import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Bottom spacing that clears the system bar, tuned per platform. Android's nav bar is
 * opaque, so `base` is added above the inset; iOS's home indicator is a thin overlay whose
 * inset already is the spacing. Floored at `base` for devices with no bottom bar.
 */
export function useBottomSpace(base: number): number {
	const insets = useSafeAreaInsets();
	const bottom =
		Platform.OS === 'android' ? insets.bottom + base : insets.bottom;
	return Math.max(base, bottom);
}
