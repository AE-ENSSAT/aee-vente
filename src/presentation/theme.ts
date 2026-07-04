/** Horizontal margin kept between the app's screen content and the screen edges. */
export const APP_MARGIN = 30;

/**
 * Base gap kept below the last element and the system bar (Android nav bar / iOS home
 * indicator). Combined with `useSafeAreaInsets().bottom`, never a hardcoded platform value.
 */
export const BOTTOM_GAP = 16;

/** Floating basket button diameter. */
export const FAB_SIZE = 64;

/** The floating basket button's base offset above the bottom safe-area inset. */
export const FAB_GAP = 28;

/**
 * App font faces (Montserrat). Loaded at runtime in the root layout. React Native picks the
 * face by `fontFamily`, not `fontWeight`, so each weight is its own named face:
 * `regular` (400) for body, `bold` (700) for emphasis, `black` (900) for titles.
 */
export const FONT = {
	regular: 'Montserrat_400Regular',
	bold: 'Montserrat_700Bold',
	black: 'Montserrat_900Black',
} as const;
