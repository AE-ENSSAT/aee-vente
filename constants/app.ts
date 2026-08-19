import Constants from 'expo-constants';

/**
 * The app's own identity, surfaced from `app.config.js` `extra` — which reads it straight
 * out of package.json, so the name and version have a single source of truth and can't
 * drift from the manifest.
 */
const extra = (Constants.expoConfig?.extra ?? {}) as {
	appName?: string;
	appVersion?: string;
};

/** Package name, e.g. `aee-vente`. */
export const APP_NAME = extra.appName ?? 'aee-vente';

/** Package version, e.g. `1.0.0`. */
export const APP_VERSION = extra.appVersion ?? '0.0.0';

/**
 * User-Agent sent on every outgoing request (`aee-vente/1.0.0`).
 *
 * Without it, iOS falls back to NSURLSession's default —
 * `AEEVente/1 CFNetwork/… Darwin/…` — where the trailing `1` is `CFBundleVersion` (the
 * *build* number), not the app version. Setting it explicitly makes the app's real
 * version legible in server logs and in a proxy like Charles. React Native doesn't
 * enforce the browser's forbidden-header list, so this header is honoured on both
 * platforms (iOS NSURLSession and Android OkHttp only supply a default when none is set).
 */
export const USER_AGENT = `${APP_NAME}/${APP_VERSION}`;
