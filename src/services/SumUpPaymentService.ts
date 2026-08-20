import { PermissionsAndroid, Platform } from 'react-native';
import { SUMUP_AFFILIATE_KEY } from '@/constants/sumup';
import { SumUp } from '@/modules/sumup-tap-to-pay-sdk-react-native';
import type {
	PaymentMethod,
	PaymentResult,
	PaymentService,
	TapToPayAvailability,
} from './PaymentService';

/** Android 12+ requires runtime Bluetooth permissions before using the card reader. */
async function requestBluetoothPermissions(): Promise<boolean> {
	if (Platform.OS !== 'android' || Platform.Version < 31) {
		return true;
	}
	const results = await PermissionsAndroid.requestMultiple([
		PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
		PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
	]);
	return (
		results[PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT] ===
			PermissionsAndroid.RESULTS.GRANTED &&
		results[PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN] ===
			PermissionsAndroid.RESULTS.GRANTED
	);
}

/**
 * {@link PaymentService} over the SumUp module. `prepare()` starts one login that every
 * payment awaits.
 *
 * The access token is the **tenant's** — each association has its own merchant account. The
 * affiliate key still comes from `.env`: it identifies the app, not the merchant.
 */
export class SumUpPaymentService implements PaymentService {
	/** The tenant's key, kept so a login that failed can be retried on the next payment. */
	private token: string | null = null;
	private session: { token: string; login: Promise<unknown> } | null = null;

	private ensureLoggedIn(): Promise<unknown> {
		if (this.session) {
			return this.session.login;
		}
		if (this.token) {
			// Retry a pre-login that failed (offline at start-up) rather than fail the sale.
			return this.login(this.token);
		}
		// Refusing beats charging through whichever account happened to be logged in last.
		throw new Error(
			'Aucune clé SumUp pour cette association — vérifiez sa configuration de paiement.',
		);
	}

	/** One login per token, shared by every caller; a new token switches account. */
	private login(accessToken: string): Promise<unknown> {
		if (this.session?.token === accessToken) {
			return this.session.login;
		}
		// A different key is a different merchant account, so end the previous session first
		// or the SDK keeps taking money into the association we just left. Best-effort.
		const previous = this.session;
		this.token = accessToken;
		const login = (
			previous ? SumUp.logout().catch(() => undefined) : Promise.resolve()
		)
			.then(() => SumUp.login(accessToken, SUMUP_AFFILIATE_KEY))
			.catch((error) => {
				if (this.session?.login === login) {
					this.session = null; // let the next call retry
				}
				throw error;
			});
		this.session = { token: accessToken, login };
		return login;
	}

	async prepare(accessToken: string): Promise<void> {
		await this.login(accessToken);
	}

	async pay(
		method: PaymentMethod,
		amountCents: number,
	): Promise<PaymentResult> {
		await this.ensureLoggedIn();
		if (method === 'bluetoothCardReader') {
			await requestBluetoothPermissions();
		}
		return SumUp.pay({ method, amount: amountCents, currency: 'EUR' });
	}

	async openReaderSettings(): Promise<void> {
		await this.ensureLoggedIn();
		await requestBluetoothPermissions();
		await SumUp.openCardReaderSettings();
	}

	async activateTapToPay(): Promise<TapToPayAvailability> {
		if (Platform.OS !== 'ios') {
			throw new Error(
				'Tap to Pay sur iPhone est disponible uniquement sur iOS.',
			);
		}
		await this.ensureLoggedIn();
		return SumUp.activateTapToPay();
	}

	async presentTapToPayEducation(): Promise<void> {
		if (Platform.OS !== 'ios') {
			throw new Error(
				'Tap to Pay sur iPhone est disponible uniquement sur iOS.',
			);
		}
		// Apple's education UI needs only the entitlement, not a SumUp session — so no login.
		await SumUp.presentTapToPayEducation();
	}
}
