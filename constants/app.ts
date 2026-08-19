import Constants from 'expo-constants';

/** The app's identity, from `app.config.js` `extra`, which reads it out of package.json. */
const extra = (Constants.expoConfig?.extra ?? {}) as {
	appName?: string;
	appVersion?: string;
};

export const APP_NAME = extra.appName ?? 'aee-vente';

export const APP_VERSION = extra.appVersion ?? '0.0.0';

/**
 * Sent on every request (`aee-vente/1.0.0`). Left unset, iOS falls back to NSURLSession's
 * default, whose trailing number is `CFBundleVersion` — the build, not the app version.
 */
export const USER_AGENT = `${APP_NAME}/${APP_VERSION}`;
