import * as FileSystem from 'expo-file-system/legacy';
import type { CheckoutMethod } from '@/src/services/PaymentService';

/** One line of a sale — a denormalized snapshot (names/prices as they were at sale time). */
export interface TransactionLine {
	productName: string;
	/** Variant name, or null for a product sold without a variant. */
	variantName: string | null;
	quantity: number;
	/** Unit price in integer minor units (cents) at the time of sale. */
	unitCents: number;
}

/** A completed sale, persisted locally on the device. */
export interface Transaction {
	/** SumUp transaction code (or the client transaction id) — unique per sale. */
	id: string;
	/** Epoch milliseconds the sale was recorded. */
	timestamp: number;
	/** Integer minor units (cents). */
	amountCents: number;
	method: CheckoutMethod;
	/** Outcome of the payment attempt. Declined attempts are recorded too, so a
	 *  confidential receipt can still be offered for them (Apple Tap to Pay req 5.10). */
	status: 'approved' | 'declined';
	lines: TransactionLine[];
}

/**
 * On-device sale history, a JSON file in the document directory: it survives restarts and
 * is wiped on sign-out. Declined attempts are kept too. Swappable for SumUp's Transactions
 * API later without touching the screens, as long as {@link Transaction} holds.
 */
const FILE_URI = `${FileSystem.documentDirectory}transactions.json`;

async function readAll(): Promise<Transaction[]> {
	try {
		const info = await FileSystem.getInfoAsync(FILE_URI);
		if (!info.exists) {
			return [];
		}
		const raw = await FileSystem.readAsStringAsync(FILE_URI);
		const parsed: unknown = JSON.parse(raw);
		if (!Array.isArray(parsed)) {
			return [];
		}
		// Older records predate `lines` and `status`; treat those as approved sales.
		return (parsed as Transaction[]).map((t) => ({
			...t,
			status: t.status === 'declined' ? 'declined' : 'approved',
			lines: Array.isArray(t.lines) ? t.lines : [],
		}));
	} catch {
		// Corrupt / unreadable file: treat as empty rather than crashing the history.
		return [];
	}
}

async function writeAll(list: Transaction[]): Promise<void> {
	await FileSystem.writeAsStringAsync(FILE_URI, JSON.stringify(list));
}

export const transactionStore = {
	/** All recorded sales, newest first. */
	async list(): Promise<Transaction[]> {
		const all = await readAll();
		return all.sort((a, b) => b.timestamp - a.timestamp);
	},

	/** A single sale by id, or null if it isn't in the history. */
	async get(id: string): Promise<Transaction | null> {
		const all = await readAll();
		return all.find((t) => t.id === id) ?? null;
	},

	/** Append a completed sale. Payments are sequential, so no write races in practice. */
	async add(input: {
		id: string;
		amountCents: number;
		method: CheckoutMethod;
		status: 'approved' | 'declined';
		lines: TransactionLine[];
	}): Promise<void> {
		const all = await readAll();
		all.push({
			id: input.id,
			timestamp: Date.now(),
			amountCents: input.amountCents,
			method: input.method,
			status: input.status,
			lines: input.lines,
		});
		await writeAll(all);
	},

	/** Remove the whole history (called on sign-out). */
	async clear(): Promise<void> {
		try {
			await FileSystem.deleteAsync(FILE_URI, { idempotent: true });
		} catch {
			// Nothing to delete / already gone — fine.
		}
	},
};
