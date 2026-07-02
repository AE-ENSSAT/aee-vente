/** Horizontal margin kept between the app's screen content and the screen edges. */
export const APP_MARGIN = 30;

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
