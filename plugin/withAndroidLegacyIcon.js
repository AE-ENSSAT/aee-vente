/**
 * Expo config plugin: emit the Android launcher raster as PNG instead of WEBP.
 *
 * Firebase App Distribution decodes the icon as a bitmap and fails on the WEBP that Expo
 * emits (`withAndroidIcons` hardcodes `ic_launcher.webp`), falling back to a generic grey
 * "A". Per density folder this writes `ic_launcher.png` and deletes the colliding `.webp` —
 * same base name is the same resource id, which aapt rejects as a duplicate — plus any
 * round variant.
 *
 * It leaves `mipmap-anydpi-v26/ic_launcher.xml` alone: the adaptive icon is what fills the
 * launcher's mask on the device, and stripping it makes Android shrink the raster into a
 * generated white circle instead. The PNG stays as the bitmap App Distribution can decode.
 *
 * It reliably runs last: user plugins register their mods BEFORE the built-in icon mod, and
 * same-name dangerous mods execute in reverse registration order.
 */
const { withDangerousMod } = require('@expo/config-plugins');
const { generateImageAsync } = require('@expo/image-utils');
const fs = require('node:fs');
const path = require('node:path');

// Legacy launcher sizes per density: 48dp baseline × each density's scale, as
// @expo/prebuild-config does it.
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

				// generateImageAsync always returns a PNG buffer (sharp, or the bundled Jimp
				// fallback), so CI needs no sharp install.
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

			return config;
		},
	]);
};

module.exports = withAndroidLegacyIcon;
