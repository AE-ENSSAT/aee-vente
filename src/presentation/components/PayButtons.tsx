import { Ionicons } from '@expo/vector-icons';
import { useCallback, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSumUp } from '@/src/presentation/sumup/SumUpContext';
import type {
	CheckoutMethod,
	PaymentMethod,
} from '@/src/services/PaymentService';
import { FONT } from '../theme';
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
	/** The rails this tenant has enabled (`GET /payment-method-config`) — only these are
	 *  offered. Defaults to all of them while the config is loading, so a slow or failed
	 *  fetch never leaves the merchant with no way to take money. */
	enabledMethods: CheckoutMethod[];
	/** Which method is being charged (null when idle) — only that button spins, so the others
	 *  never look disabled (Apple Tap to Pay req 5.3). */
	pendingMethod: CheckoutMethod | null;
	/** A failure to surface (a declined/aborted payment), or null. */
	error: string | null;
	/** Clear the payment error banner. */
	onDismissError: () => void;
	/** Charge a card method now — the SumUp native UI is its own confirmation. */
	onPayCard: (method: PaymentMethod) => void;
	/** Choose cash — hands off to the confirmation step (cash has no card UI to confirm it). */
	onSelectCash: () => void;
}

/**
 * The method chooser shown on the {@link PaymentSheet}: the card methods (Tap to Pay, the
 * Bluetooth reader) and cash ("Espèces", in green) as equal full-width choices, then — clearly
 * demoted to an underlined link, since it isn't a way to pay — the card-reader settings.
 *
 * Presentation only: the checkout hook lives up in the sheet (which also owns the cash-confirm
 * step), so this component just reports which method was chosen. No pay button is greyed on an
 * empty basket (Apple req 5.3), and the sheet is only reachable from a non-empty basket anyway.
 */
export function PayButtons({
	enabledMethods,
	pendingMethod,
	error,
	onDismissError,
	onPayCard,
	onSelectCash,
}: Props) {
	const busy = pendingMethod !== null;
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
		onDismissError();
		setSettingsError(null);
	}, [onDismissError]);

	return (
		<View style={styles.container}>
			<PaymentErrorBanner message={banner} onDismiss={dismissBanner} />
			<View style={styles.methods}>
				{enabledMethods.includes('tapToPay') && (
					<PrimaryButton
						label={TAP_TO_PAY_LABEL}
						variant="primary"
						loading={pendingMethod === 'tapToPay'}
						onPress={() => onPayCard('tapToPay')}
						icon={<TapToPayIcon color="#ffffff" size={22} />}
					/>
				)}
				{enabledMethods.includes('bluetoothCardReader') && (
					<PrimaryButton
						label="Terminal de paiement"
						variant="secondary"
						loading={pendingMethod === 'bluetoothCardReader'}
						onPress={() => onPayCard('bluetoothCardReader')}
						icon={
							<Ionicons
								name="bluetooth-outline"
								size={20}
								color="#ffffff"
							/>
						}
					/>
				)}
				{enabledMethods.includes('cash') && (
					<PrimaryButton
						label="Espèces"
						variant="success"
						disabled={busy}
						onPress={onSelectCash}
						icon={
							<Ionicons
								name="cash-outline"
								size={20}
								color="#ffffff"
							/>
						}
					/>
				)}
			</View>
			{/* Not a payment method — a utility. Kept as a small, understated link so it never
			    reads as a fourth way to pay, and hidden when the reader isn't on offer at all. */}
			{enabledMethods.includes('bluetoothCardReader') && (
				<Pressable
					onPress={openSettings}
					disabled={busy}
					style={({ pressed }) => [
						styles.settingsLink,
						pressed && styles.settingsLinkPressed,
						busy && styles.settingsLinkDisabled,
					]}
					accessibilityRole="button"
					accessibilityLabel="Réglages du terminal de paiement"
				>
					<Ionicons
						name="settings-outline"
						size={16}
						color="#767676"
					/>
					<Text style={styles.settingsLinkLabel}>
						Réglages du terminal de paiement
					</Text>
				</Pressable>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	container: { gap: 16 },
	methods: { gap: 10 },
	settingsLink: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 6,
		paddingVertical: 10,
	},
	settingsLinkPressed: { opacity: 0.6 },
	settingsLinkDisabled: { opacity: 0.4 },
	settingsLinkLabel: {
		fontSize: 13,
		fontFamily: FONT.regular,
		color: '#767676',
		textDecorationLine: 'underline',
	},
});
