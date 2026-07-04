import { Linking, Platform } from 'react-native';
import type { Transaction } from '@/src/data/transactionStore';
import { formatEuros } from './money';

/** "04/07/2026 14:32" */
function formatReceiptDate(timestamp: number): string {
	const d = new Date(timestamp);
	const pad = (n: number) => String(n).padStart(2, '0');
	return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function methodLabel(method: Transaction['method']): string {
	return method === 'tapToPay'
		? 'Tap to Pay sur iPhone'
		: 'Terminal de paiement';
}

/**
 * A plain-text, itemized receipt for a sale. Used as the body of the e-mail / SMS and as
 * the QR payload — so scanning the code reveals the same receipt offline (no backend). Kept
 * compact so the QR stays a low, scannable version.
 */
export function buildReceiptText(tx: Transaction): string {
	const lines = tx.lines.map((line) => {
		const name = line.variantName
			? `${line.productName} – ${line.variantName}`
			: line.productName;
		return `${line.quantity}× ${name} — ${formatEuros(line.unitCents * line.quantity)}`;
	});
	return [
		'AEE Vente — Reçu',
		formatReceiptDate(tx.timestamp),
		'',
		...lines,
		'',
		`Total : ${formatEuros(tx.amountCents)}`,
		`Paiement : ${methodLabel(tx.method)}`,
		`Réf. : ${tx.id}`,
	].join('\n');
}

/** Subject line for the e-mail receipt. */
const EMAIL_SUBJECT = 'Votre reçu — AEE Vente';

/**
 * Open the device's mail composer prefilled with the receipt (no recipient — the merchant
 * fills the customer's address in). Uses a `mailto:` deep link so it needs no native module.
 * Rejects if no mail app can handle it, so the caller can surface a fallback.
 */
export async function sendReceiptByEmail(tx: Transaction): Promise<void> {
	const url = `mailto:?subject=${encodeURIComponent(EMAIL_SUBJECT)}&body=${encodeURIComponent(
		buildReceiptText(tx),
	)}`;
	await Linking.openURL(url);
}

/**
 * Open the device's SMS composer prefilled with the receipt. The query separator differs by
 * platform (`sms:&body=` on iOS, `sms:?body=` on Android), otherwise the body is dropped.
 */
export async function sendReceiptBySms(tx: Transaction): Promise<void> {
	const separator = Platform.OS === 'ios' ? '&' : '?';
	const url = `sms:${separator}body=${encodeURIComponent(buildReceiptText(tx))}`;
	await Linking.openURL(url);
}
