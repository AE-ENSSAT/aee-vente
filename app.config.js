/**
 * Expo app config (dynamic). The SumUp wrapper is a local Expo module under
 * `modules/sumup-tap-to-pay-sdk` (autolinked), so it needs no entry here beyond
 * the native build config below.
 */
const fs = require('node:fs');
const path = require('node:path');

// --- App variant -----------------------------------------------------------
// A separate `.dev` identity lets the test build (develop → Firebase) sit on a
// device ALONGSIDE the production build (main → stores) with no install conflict.
// CI sets APP_VARIANT=dev on `develop`; unset (prod) keeps the plain id.
// NOTE: the `.dev` id needs its OWN provisioning — see docs/CI.md ("App variants").
const IS_DEV = process.env.APP_VARIANT === 'dev';
const BUNDLE_ID = IS_DEV ? 'bzh.aee.vente.dev' : 'bzh.aee.vente';
const APP_NAME = IS_DEV ? 'AEE Vente Dev' : 'AEE Vente';
// Drop an `icon-dev.png` next to icon.png to visually distinguish dev; otherwise
// the dev build reuses the shared icon (no broken build if the file is absent).
const DEV_ICON = './assets/images/icon-dev.png';
const ICON =
	IS_DEV && fs.existsSync(path.resolve(__dirname, DEV_ICON))
		? DEV_ICON
		: './assets/images/icon.png';

module.exports = () => ({
	expo: {
		name: APP_NAME,
		slug: 'aee-vente',
		version: '1.0.0',
		orientation: 'portrait',
		icon: ICON,
		scheme: 'aeevente',
		userInterfaceStyle: 'automatic',
		newArchEnabled: true,
		ios: {
			supportsTablet: false,
			bundleIdentifier: BUNDLE_ID,
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
				// Tap to Pay on iPhone requires an A12 Bionic chip or later (iPhone XS+).
				// Apple's Tap to Pay App Review checklist (req 1.3) requires declaring this
				// so the App Store restricts installs to compatible devices. NOTE: this also
				// blocks pre-A12 iPhones (X / 8 and earlier) that could otherwise use the
				// Bluetooth card reader — remove this key if you need to support them.
				UIRequiredDeviceCapabilities: [
					'iphone-ipad-minimum-performance-a12',
				],
			},
		},
		android: {
			package: BUNDLE_ID,
			// Legacy square launcher icon (mipmap ic_launcher.png). Firebase App
			// Distribution reads this raster PNG, not the adaptive-icon XML; without
			// it the PNG is derived from the padded adaptive foreground and App
			// Distribution can't decode it, showing a generic "A" placeholder.
			icon: ICON,
			adaptiveIcon: {
				foregroundImage: './assets/images/adaptive-icon.png',
				backgroundColor: '#ffffff',
			},
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
					// Tap to Pay on iPhone floor. Apple's checklist (req 1.2) wants the
					// deployment target set to the minimum iOS your Tap to Pay config
					// supports; SumUp's SDK requires iOS 16.7+ (ideally 17.5+). Devices on
					// 16.7–17.5 can still install (and use the Bluetooth reader), and the
					// app shows an "update iOS" message for Tap to Pay below 17.6 (req 1.4).
					ios: { deploymentTarget: '16.7' },
					// Tap to Pay requires minSdk 30 and Java 17 (Expo 54 default).
					android: {
						minSdkVersion: 30,
						// CI pins this to an NDK preinstalled on the runner (see the
						// ANDROID_NDK_VERSION env in build-and-distribute.yml) so the
						// Gradle build skips downloading RN's default NDK. Unset
						// locally → RN's default is used.
						...(process.env.ANDROID_NDK_VERSION && {
							ndkVersion: process.env.ANDROID_NDK_VERSION,
						}),
					},
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
