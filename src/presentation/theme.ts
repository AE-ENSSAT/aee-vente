import type { TextStyle } from 'react-native';

/** Horizontal margin kept between the app's screen content and the screen edges. */
export const APP_MARGIN = 30;

/** Gap below the last element, combined with `useSafeAreaInsets().bottom` — never hardcoded. */
export const BOTTOM_GAP = 16;

export const FAB_SIZE = 64;

/** The floating basket button's base offset above the bottom safe-area inset. */
export const FAB_GAP = 28;

/**
 * Montserrat, loaded in the root layout. RN picks a face by `fontFamily`, not
 * `fontWeight`, so each weight is its own named face.
 */
export const FONT = {
	regular: 'Montserrat_400Regular',
	bold: 'Montserrat_700Bold',
	black: 'Montserrat_900Black',
} as const;

/**
 * The one page-header title style — the "Réglages" look, worn by every header **bar**,
 * screens and sheets alike. `flex: 1` with centred text optically centres it between
 * whatever sits either side; each bar pads its empty side with a spacer.
 *
 * Not for dialog cards or brand wordmarks: `flex: 1` in a column stretches vertically.
 */
export const SCREEN_TITLE: TextStyle = {
	flex: 1,
	textAlign: 'center',
	fontSize: 18,
	fontFamily: FONT.black,
	color: '#A91B3A',
	letterSpacing: 0.2,
};
