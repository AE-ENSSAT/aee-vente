import { Ionicons } from '@expo/vector-icons';
import { useCallback, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useCheckout } from '@/src/presentation/checkout/useCheckout';
import { useSumUp } from '@/src/presentation/sumup/SumUpContext';
import { PaymentErrorBanner } from './PaymentErrorBanner';
import { PrimaryButton } from './PrimaryButton';

/** Tap to Pay runs on the host device — label it per platform. */
const TAP_TO_PAY_LABEL =
	Platform.OS === 'ios' ? 'Tap To Pay sur iPhone' : 'Tap To Pay sur Android';

interface Props {
	disabled?: boolean;
	/** Fired after a successful payment (drives the confetti on the sell screen). */
	onPaymentSuccess?: () => void;
}

/**
 * The three full-width payment actions: Tap to Pay, Bluetooth card reader, and (in a
 * distinct colour) the card-reader settings. Payment orchestration lives in
 * {@link useCheckout}; this component is presentation only.
 */
export function PayButtons({ disabled, onPaymentSuccess }: Props) {
	const { checkout, busy, error, dismissError } =
		useCheckout(onPaymentSuccess);
	const { openReaderSettings } = useSumUp();
	const [settingsError, setSettingsError] = useState<string | null>(null);

	const openSettings = async () => {
		setSettingsError(null);
		try {
			await openReaderSettings();
		} catch (e) {
			setSettingsError(e instanceof Error ? e.message : String(e));
		}
	};

	// One banner covers both a refused payment and a reader-settings error.
	const banner = error ?? settingsError;
	const dismissBanner = useCallback(() => {
		dismissError();
		setSettingsError(null);
	}, [dismissError]);

	return (
		<View style={styles.container}>
			<PaymentErrorBanner message={banner} onDismiss={dismissBanner} />
			<PrimaryButton
				label={TAP_TO_PAY_LABEL}
				variant="primary"
				loading={busy}
				disabled={disabled}
				onPress={() => checkout('tapToPay')}
				icon={
					<Ionicons
						name="phone-portrait-outline"
						size={20}
						color="#ffffff"
					/>
				}
			/>
			<PrimaryButton
				label="Terminal de paiement"
				variant="secondary"
				loading={busy}
				disabled={disabled}
				onPress={() => checkout('bluetoothCardReader')}
				icon={
					<Ionicons
						name="bluetooth-outline"
						size={20}
						color="#ffffff"
					/>
				}
			/>
			<PrimaryButton
				label="Réglages du terminal de paiement"
				variant="tertiary"
				onPress={openSettings}
				icon={
					<Ionicons
						name="settings-outline"
						size={20}
						color="#1A1A1A"
					/>
				}
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	container: { gap: 10 },
});
