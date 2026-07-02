/**
 * Expo app config (dynamic). The SumUp wrapper is a local Expo module under
 * `modules/sumup-tap-to-pay-sdk` (autolinked), so it needs no entry here beyond
 * the native build config below.
 */
module.exports = () => ({
	expo: {
		name: 'AEE Vente',
		slug: 'aee-vente',
		version: '1.0.0',
		orientation: 'portrait',
		icon: './assets/images/icon.png',
		scheme: 'aeevente',
		userInterfaceStyle: 'automatic',
		newArchEnabled: true,
		ios: {
			supportsTablet: false,
			bundleIdentifier: 'bzh.aee.vente',
			// CI sets BUILD_NUMBER (github.run_number) so each distributed build is
			// distinct; defaults to '1' for local builds.
			buildNumber: process.env.BUILD_NUMBER ?? '1',
			// Tap to Pay on iPhone requires this entitlement, granted by Apple on the
			// app's provisioning profile.
			entitlements: {
				'com.apple.developer.proximity-reader.payment.acceptance': true,
			},
			infoPlist: {
				NSBluetoothAlwaysUsageDescription:
					'AEE Vente uses Bluetooth to connect to the SumUp card reader.',
				NSLocationWhenInUseUsageDescription:
					'AEE Vente needs your location to accept card payments securely.',
			},
		},
		android: {
			package: 'bzh.aee.vente',
			// See ios.buildNumber — kept in sync so both stores get monotonic builds.
			versionCode: Number(process.env.BUILD_NUMBER ?? 1),
			edgeToEdgeEnabled: true,
			permissions: [
				'android.permission.INTERNET',
				'android.permission.BLUETOOTH_CONNECT',
				'android.permission.BLUETOOTH_SCAN',
				'android.permission.ACCESS_FINE_LOCATION',
			],
		},
		plugins: [
			'expo-router',
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
					ios: { deploymentTarget: '16.0' },
					// Tap to Pay requires minSdk 30 and Java 17 (Expo 54 default).
					android: { minSdkVersion: 30 },
				},
			],
			'./modules/sumup-tap-to-pay-sdk-react-native/plugin/withSumUp',
			// Adds a real Android release signing config (falls back to debug when the
			// AEE_UPLOAD_* Gradle props are absent). See plugin/withAndroidSigning.js.
			'./plugin/withAndroidSigning',
		],
		experiments: {
			typedRoutes: true,
		},
		// SumUp runtime keys, read from the environment / .env at config time.
		// NOTE: `extra` is bundled into the app — fine for a demo; for production
		// fetch the access token from your backend instead of shipping it.
		extra: {
			sumupAffiliateKey: process.env.SUMUP_AFFILIATE_KEY ?? '',
			sumupAccessToken: process.env.SUMUP_ACCESS_TOKEN ?? '',
		},
	},
});
