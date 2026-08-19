import { Platform } from 'react-native';

/**
 * Apple's checklist (req 1.4) wants the app to say "update iOS" rather than fail silently
 * below 17.6. The app installs on 16.7+, where the Bluetooth reader still works.
 */
const MIN_TAP_TO_PAY_IOS = { major: 17, minor: 6 };

/** True on an iPhone whose iOS is older than Tap to Pay supports (below 17.6). */
export function isTapToPayIosTooOld(): boolean {
	if (Platform.OS !== 'ios') {
		return false;
	}
	const [major = 0, minor = 0] = String(Platform.Version)
		.split('.')
		.map((part) => Number.parseInt(part, 10) || 0);
	return (
		major < MIN_TAP_TO_PAY_IOS.major ||
		(major === MIN_TAP_TO_PAY_IOS.major && minor < MIN_TAP_TO_PAY_IOS.minor)
	);
}

/** Message shown when Tap to Pay is attempted on an iPhone that needs a newer iOS. */
export const TAP_TO_PAY_UPDATE_IOS_MESSAGE =
	'Tap to Pay sur iPhone nécessite iOS 17.6 ou une version ultérieure. Mettez à jour votre iPhone dans Réglages › Général › Mise à jour logicielle.';
