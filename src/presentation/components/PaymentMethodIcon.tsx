import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import type { CheckoutMethod } from '@/src/services/PaymentService';

interface Props {
	method: CheckoutMethod;
	size: number;
	color: string;
}

/**
 * The glyph for a settlement method, shared by the history list and the receipt detail so
 * they stay in sync: a contactless mark for Tap to Pay, a Bluetooth mark for the card reader,
 * and banknotes for cash.
 */
export function PaymentMethodIcon({ method, size, color }: Props) {
	if (method === 'tapToPay') {
		return <MaterialIcons name="contactless" size={size} color={color} />;
	}
	if (method === 'cash') {
		return <Ionicons name="cash-outline" size={size} color={color} />;
	}
	return <Ionicons name="bluetooth-outline" size={size} color={color} />;
}
