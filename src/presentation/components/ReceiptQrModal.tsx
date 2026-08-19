import { Ionicons } from '@expo/vector-icons';
import qrcode from 'qrcode-generator';
import { useMemo, useState } from 'react';
import { Image, Modal, Pressable, StyleSheet, Text } from 'react-native';
import { FONT } from '../theme';

/**
 * Encode to a byte string whose char codes are the UTF-8 bytes. qrcode-generator's default
 * encoder truncates each char to `charCodeAt & 0xff`, which turns the receipt's €, — and
 * accents to mojibake. Done here because the ESM build Metro resolves has no
 * `stringToBytesFuncs['UTF-8']` map.
 */
function toUtf8ByteString(str: string): string {
	let out = '';
	for (let i = 0; i < str.length; i += 1) {
		let c = str.charCodeAt(i);
		if (c < 0x80) {
			out += String.fromCharCode(c);
		} else if (c < 0x800) {
			out += String.fromCharCode(0xc0 | (c >> 6), 0x80 | (c & 0x3f));
		} else if (c < 0xd800 || c >= 0xe000) {
			out += String.fromCharCode(
				0xe0 | (c >> 12),
				0x80 | ((c >> 6) & 0x3f),
				0x80 | (c & 0x3f),
			);
		} else {
			// Surrogate pair → combine the two halves into one code point.
			i += 1;
			c = 0x10000 + (((c & 0x3ff) << 10) | (str.charCodeAt(i) & 0x3ff));
			out += String.fromCharCode(
				0xf0 | (c >> 18),
				0x80 | ((c >> 12) & 0x3f),
				0x80 | ((c >> 6) & 0x3f),
				0x80 | (c & 0x3f),
			);
		}
	}
	return out;
}

interface Props {
	/** The string to encode as a QR, or null to keep the modal closed. */
	value: string | null;
	onClose: () => void;
}

const QR_DISPLAY = 240;
/** Kept high so the Image downscales a crisp source rather than upscaling a tiny one. */
const QR_CELL = 8;

/**
 * The receipt as a QR the customer scans. It encodes the receipt text itself, so scanning
 * works offline — there is no backend to point a URL at.
 */
export function ReceiptQrModal({ value, onClose }: Props) {
	// `value` drops to null on "Fermer" while the Modal is still fading out. Hold the last
	// non-null one so the QR fades with the window instead of vanishing first.
	const [shown, setShown] = useState<string | null>(value);
	if (value !== null && value !== shown) {
		setShown(value);
	}

	return (
		<Modal
			visible={value !== null}
			transparent
			animationType="fade"
			onRequestClose={onClose}
			statusBarTranslucent
		>
			{/* Tap the dim backdrop to dismiss; taps on the card are swallowed. */}
			<Pressable style={styles.backdrop} onPress={onClose}>
				<Pressable style={styles.card}>
					<Text style={styles.title}>Reçu</Text>
					<Text style={styles.subtitle}>
						Scannez ce code pour votre reçu.
					</Text>
					{shown !== null && <QrImage value={shown} />}
					<Pressable
						style={({ pressed }) => [
							styles.closeBtn,
							pressed && styles.pressed,
						]}
						onPress={onClose}
						accessibilityRole="button"
						accessibilityLabel="Fermer"
					>
						<Ionicons name="close" size={20} color="#1A1A1A" />
						<Text style={styles.closeLabel}>Fermer</Text>
					</Pressable>
				</Pressable>
			</Pressable>
		</Modal>
	);
}

/**
 * The QR as a single <Image>: qrcode-generator emits a GIF data URI in pure JS (no
 * react-native-svg, no prebuild), and one Image beats a grid of hundreds of Views.
 */
function QrImage({ value }: { value: string }) {
	const uri = useMemo(() => {
		// type 0 = smallest version that fits; error-correction level M (~15%).
		const qr = qrcode(0, 'M');
		qr.addData(toUtf8ByteString(value));
		qr.make();
		// No margin argument → a 4-module quiet zone.
		return qr.createDataURL(QR_CELL);
	}, [value]);

	return (
		<Image
			source={{ uri }}
			style={styles.qr}
			resizeMode="contain"
			accessibilityRole="image"
			accessibilityLabel="QR code du reçu"
		/>
	);
}

const styles = StyleSheet.create({
	backdrop: {
		flex: 1,
		backgroundColor: 'rgba(0,0,0,0.55)',
		alignItems: 'center',
		justifyContent: 'center',
		padding: 24,
	},
	card: {
		backgroundColor: '#ffffff',
		borderRadius: 20,
		paddingHorizontal: 24,
		paddingTop: 24,
		paddingBottom: 20,
		alignItems: 'center',
		gap: 14,
	},
	title: {
		fontSize: 20,
		fontFamily: FONT.black,
		color: '#A91B3A',
	},
	subtitle: {
		fontSize: 14,
		fontFamily: FONT.regular,
		color: '#4A4A4A',
		textAlign: 'center',
	},
	qr: {
		width: QR_DISPLAY,
		height: QR_DISPLAY,
		borderRadius: 8,
		backgroundColor: '#ffffff',
	},
	closeBtn: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
		backgroundColor: '#E5E1DA',
		borderRadius: 12,
		paddingHorizontal: 20,
		paddingVertical: 12,
		marginTop: 4,
	},
	closeLabel: { fontSize: 15, fontFamily: FONT.bold, color: '#1A1A1A' },
	pressed: { opacity: 0.85 },
});
