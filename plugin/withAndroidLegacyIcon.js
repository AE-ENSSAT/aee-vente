/**
 * Expo config plugin: force a PLAIN PNG RASTER Android launcher icon.
 *
 * WHY: Firebase App Distribution (both the web console and the App Tester install
 * screen) renders the app icon by decoding it as a bitmap. It cannot render an
 * adaptive icon (`mipmap-anydpi-v26/ic_launcher.xml`), and its extractor also fails
 * on the WEBP raster that Expo emits -- either way it falls back to a generic gray
 * "A". iOS is unaffected.
 *
 * `@expo/prebuild-config`'s `withAndroidIcons` already deletes the adaptive XML when
 * `android.adaptiveIcon` is unset, BUT it hardcodes the legacy raster filename to
 * `ic_launcher.webp` (see IC_LAUNCHER_WEBP in withAndroidIcons.js -- there is no
 * option to emit PNG). This plugin runs AFTER that mod and, per density folder:
 *   1. writes `ic_launcher.png` (a resized copy of the source icon), and
 *   2. deletes the sibling `ic_launcher.webp` -- a `.png` and a `.webp` with the
 *      same base name in one res folder are the SAME resource id, so leaving both
 *      is an aapt "duplicate resources" build failure -- plus any `ic_launcher_round.*`.
 * It also deletes `mipmap-anydpi-v26/ic_launcher*.xml` defensively so no adaptive
 * icon can shadow the raster.
 *
 * ORDERING (why this reliably runs last): user config plugins register their mods
 * inside `getConfig({ isModdedConfig: true })`, i.e. BEFORE `getPrebuildConfig` adds
 * the built-in `withAndroidIcons`. Same-name dangerous mods execute in REVERSE
 * registration order (@expo/config-plugins withMod chaining: the last-registered mod
 * runs its body first, then delegates to `nextMod`). So the built-in icon mod runs
 * first and this one runs last -- our files land on top of Expo's.
 *
 * TRADE-OFF / PITFALL: shipping only the legacy raster means NO adaptive-icon masking
 * on the device home screen, and Google Play REQUIRES an adaptive icon for new apps.
 * This project distributes an APK to Firebase (not an AAB to Play), so that's fine;
 * if you ever ship to Play, gate this plugin behind an env flag and provide
 * `android.adaptiveIcon` for the Play build instead.
 */
const { withDangerousMod } = require('@expo/config-plugins');
const { generateImageAsync } = require('@expo/image-utils');
const fs = require('node:fs');
const path = require('node:path');

// Legacy launcher-icon pixel sizes per density. Matches @expo/prebuild-config:
// LEGACY_BASELINE_PIXEL_SIZE (48dp) multiplied by each density's scale.
const DENSITIES = [
	{ folder: 'mipmap-mdpi', size: 48 },
	{ folder: 'mipmap-hdpi', size: 72 },
	{ folder: 'mipmap-xhdpi', size: 96 },
	{ folder: 'mipmap-xxhdpi', size: 144 },
	{ folder: 'mipmap-xxxhdpi', size: 192 },
];

function rm(file) {
	return fs.promises.rm(file, { force: true });
}

const withAndroidLegacyIcon = (config) => {
	// Resolve the same source Expo uses: android.icon wins over the shared icon.
	const iconSrc = config.android?.icon ?? config.icon;
	if (!iconSrc) {
		return config;
	}

	return withDangerousMod(config, [
		'android',
		async (config) => {
			const { projectRoot, platformProjectRoot } = config.modRequest;
			const src = path.resolve(projectRoot, iconSrc);
			const resDir = path.join(platformProjectRoot, 'app/src/main/res');

			// 1. Per density: write ic_launcher.png, drop the colliding webp + round.
			for (const { folder, size } of DENSITIES) {
				const dir = path.join(resDir, folder);
				await fs.promises.mkdir(dir, { recursive: true });

				// generateImageAsync always returns a PNG buffer (sharp `.png()`
				// or the bundled Jimp fallback -> `image/png`), so no sharp
				// install is required in CI. No cacheType => resize in-process.
				const { source } = await generateImageAsync(
					{ projectRoot },
					{
						src,
						width: size,
						height: size,
						resizeMode: 'cover',
						backgroundColor: 'transparent',
					},
				);
				await fs.promises.writeFile(
					path.join(dir, 'ic_launcher.png'),
					source,
				);

				// A .webp with the same base name is a duplicate resource id.
				await rm(path.join(dir, 'ic_launcher.webp'));
				// No round variant in a plain-raster setup.
				await rm(path.join(dir, 'ic_launcher_round.webp'));
				await rm(path.join(dir, 'ic_launcher_round.png'));
			}

			// 2. Remove any adaptive icon so it can't shadow the raster.
			const anydpi = path.join(resDir, 'mipmap-anydpi-v26');
			await rm(path.join(anydpi, 'ic_launcher.xml'));
			await rm(path.join(anydpi, 'ic_launcher_round.xml'));

			return config;
		},
	]);
};

module.exports = withAndroidLegacyIcon;
