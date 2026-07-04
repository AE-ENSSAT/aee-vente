import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Bottom spacing that clears the system bar, tuned per platform.
 *
 * - **Android**: the nav bar is a solid, opaque bar, so we add `base` of breathing room
 *   *above* the inset — otherwise content sits flush against the bar.
 * - **iOS**: the home indicator is a thin, translucent overlay, so its inset already *is*
 *   the spacing — adding `base` on top reads as too much empty space. We use the inset as-is.
 *
 * Floored at `base` so devices with no bottom bar (iPad, home-button iPhone) still get a gap.
 */
export function useBottomSpace(base: number): number {
	const insets = useSafeAreaInsets();
	const bottom =
		Platform.OS === 'android' ? insets.bottom + base : insets.bottom;
	return Math.max(base, bottom);
}
