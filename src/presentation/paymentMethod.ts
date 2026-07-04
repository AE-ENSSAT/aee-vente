import { Platform } from 'react-native';
import type { CheckoutMethod } from '@/src/services/PaymentService';

/**
 * Human label for a settlement method, shared by the payment page, the transaction history
 * and the printable/QR receipt so the three never drift. Tap to Pay runs on the host device,
 * so it takes Apple's per-platform wordmark (matching the pay button); the Bluetooth reader
 * reads as a generic "terminal"; cash is "Espèces".
 */
export function paymentMethodLabel(method: CheckoutMethod): string {
	switch (method) {
		case 'tapToPay':
			return Platform.OS === 'ios'
				? 'Tap to Pay sur iPhone'
				: 'Tap to Pay sur Android';
		case 'cash':
			return 'Espèces';
		default:
			return 'Terminal de paiement';
	}
}
