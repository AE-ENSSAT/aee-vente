/** Expo app config (dynamic) — see CLAUDE.md for the native build constraints. */
// Feeds `expo.version` and the User-Agent; required here so package.json isn't bundled.
const pkg = require('./package.json');

// A separate `.dev` identity lets the test build sit on a device alongside production.
// CI sets APP_VARIANT=dev on `develop`; that id needs its own provisioning.
const IS_DEV = process.env.APP_VARIANT === 'dev';

const BUNDLE_ID = IS_DEV ? 'bzh.aee.vente.dev' : 'bzh.aee.vente';
const APP_NAME = IS_DEV ? 'AEE Vente Dev' : 'AEE Vente';
const SCHEME = IS_DEV ? 'aeevente-dev' : 'aeevente';
const ICON = './assets/images/icon.png';

module.exports = () => ({
	expo: {
		name: APP_NAME,
		slug: 'aee-vente',
		version: pkg.version,
		orientation: 'portrait',
		icon: ICON,
		scheme: SCHEME,
		userInterfaceStyle: 'automatic',
		newArchEnabled: true,
		ios: {
			supportsTablet: false,
			bundleIdentifier: BUNDLE_ID,
			// CI sets BUILD_NUMBER (github.run_number) so each build is distinct.
			buildNumber: process.env.BUILD_NUMBER ?? '1',
			// Granted by Apple on the provisioning profile.
			entitlements: {
				'com.apple.developer.proximity-reader.payment.acceptance': true,
			},
			infoPlist: {
				// The SSO consent alert shows CFBundleName, not CFBundleDisplayName, and
				// prebuild would leave it as the space-stripped target name ("AEEVente").
				CFBundleName: APP_NAME,
				NSBluetoothAlwaysUsageDescription: `${APP_NAME} uses Bluetooth to connect to the card reader.`,
				// SumUpSDK links AVCaptureDevice, so App Store validation demands this string
				// (ITMS-90683) even though nothing in the app opens the camera itself.
				NSCameraUsageDescription: `${APP_NAME} uses the camera when the payment SDK scans a card or QR code.`,
				NSLocationWhenInUseUsageDescription: `${APP_NAME} needs your location to accept card payments securely.`,
				// Tap to Pay needs A12+ (checklist req 1.3). This also blocks pre-A12 iPhones
				// that could still use the Bluetooth reader — drop the key to support them.
				UIRequiredDeviceCapabilities: [
					'iphone-ipad-minimum-performance-a12',
				],
			},
		},
		android: {
			package: BUNDLE_ID,
			// Plain raster only: Firebase App Distribution can't render adaptive icons and
			// shows a generic "A". Trade-off: no adaptive masking on the home screen.
			icon: ICON,
			// Without an adaptive icon, Android 11+ launchers can't mask an arbitrary bitmap:
			// they shrink it into the safe zone and centre it on a generated white circle, so
			// the logo reads far smaller than the tile. The foreground's artwork already sits
			// at ~66% of its canvas, which is exactly the mask's edge.
			adaptiveIcon: {
				foregroundImage: './assets/images/adaptive-icon.png',
				backgroundColor: '#ffffff',
			},
			// See ios.buildNumber — kept in sync so both stores get monotonic builds.
			versionCode: Number(process.env.BUILD_NUMBER ?? 1),
			permissions: [
				'android.permission.INTERNET',
				'android.permission.BLUETOOTH_CONNECT',
				'android.permission.BLUETOOTH_SCAN',
				'android.permission.ACCESS_FINE_LOCATION',
			],
		},
		plugins: [
			'expo-router',
			// SDK 57 requires these three to be declared explicitly.
			'expo-font',
			'expo-secure-store',
			'expo-status-bar',
			// Hosts the Keycloak SSO round-trip (ASWebAuthenticationSession / Custom Tab).
			'expo-web-browser',
			[
				'expo-splash-screen',
				{
					image: './assets/images/splash-icon.png',
					imageWidth: 200,
					resizeMode: 'contain',
					backgroundColor: '#ffffff',
					dark: { backgroundColor: '#000000' },
				},
			],
			[
				'expo-build-properties',
				{
					// Tap to Pay floor: SumUp's SDK needs iOS 16.7+ (Apple checklist req 1.2).
					// Below 17.6 the app shows an "update iOS" message instead (req 1.4).
					ios: { deploymentTarget: '16.7' },
					// Tap to Pay requires minSdk 30 and Java 17 (Expo 57 default).
					android: {
						minSdkVersion: 30,
						// CI pins an NDK preinstalled on the runner; unset locally → RN's default.
						...(process.env.ANDROID_NDK_VERSION && {
							ndkVersion: process.env.ANDROID_NDK_VERSION,
						}),
					},
				},
			],
			'./modules/sumup-tap-to-pay-sdk-react-native/plugin/withSumUp',
			// Real Android release signing; falls back to debug without the AEE_UPLOAD_* props.
			'./plugin/withAndroidSigning',
			// Plain PNG launcher icon: Firebase App Distribution can't decode adaptive/WEBP ones.
			'./plugin/withAndroidLegacyIcon',
		],
		experiments: {
			typedRoutes: true,
		},
		// NOTE: everything under `extra` ships inside the JS bundle.
		extra: {
			// Feeds the API client's User-Agent, so the runtime never imports package.json.
			appName: pkg.name,
			appVersion: pkg.version,
			// The SumUp access token is the tenant's own, fetched at runtime — never bundled.
			sumupAffiliateKey: process.env.SUMUP_AFFILIATE_KEY ?? '',
			// AEE Manager API + the Keycloak realm that issues its bearer tokens.
			// Not secrets (the client id is public), so shipping them in `extra` is fine.
			apiBaseUrl: process.env.API_BASE_URL,
			keycloakUrl: process.env.KEYCLOAK_URL,
			keycloakRealm: process.env.KEYCLOAK_REALM,
			keycloakClientId: process.env.KEYCLOAK_CLIENT_ID,
		},
	},
});
