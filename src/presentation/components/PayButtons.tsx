import { Ionicons } from '@expo/vector-icons';
import { useCallback, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useCheckout } from '@/src/presentation/checkout/useCheckout';
import { useSumUp } from '@/src/presentation/sumup/SumUpContext';
import { PaymentErrorBanner } from './PaymentErrorBanner';
import { PrimaryButton } from './PrimaryButton';
import { TapToPayIcon } from './TapToPayIcon';

/**
 * Tap to Pay runs on the host device — label it per platform. The iOS string is Apple's
 * exact wordmark ("Tap to Pay sur iPhone", lowercase "to"), per the localized Tap to Pay
 * button copy (req 5.4).
 */
const TAP_TO_PAY_LABEL =
	Platform.OS === 'ios' ? 'Tap to Pay sur iPhone' : 'Tap to Pay sur Android';

interface Props {
	/** Fired after a successful payment (drives the confetti + receipt offer on the sell
	 *  screen). Carries the sale's id, or null when it could not be persisted locally. */
	onPaymentSuccess?: (transactionId: string | null) => void;
}

/**
 * The three full-width payment actions: Tap to Pay, Bluetooth card reader, and (in a
 * distinct colour) the card-reader settings. Payment orchestration lives in
 * {@link useCheckout}; this component is presentation only.
 *
 * Neither pay button is greyed on an empty basket — Tap to Pay must never be disabled
 * (Apple req 5.3), and the Bluetooth reader is kept consistent with it. The empty-basket
 * case is a no-op, guarded inside `checkout` (totalCents <= 0).
 */
export function PayButtons({ onPaymentSuccess }: Props) {
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
				onPress={() => checkout('tapToPay')}
				icon={<TapToPayIcon color="#ffffff" size={22} />}
			/>
			<PrimaryButton
				label="Terminal de paiement"
				variant="secondary"
				loading={busy}
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
