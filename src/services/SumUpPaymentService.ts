import { PermissionsAndroid, Platform } from 'react-native';
import { SUMUP_ACCESS_TOKEN, SUMUP_AFFILIATE_KEY } from '@/constants/sumup';
import { SumUp } from '@/modules/sumup-tap-to-pay-sdk-react-native';
import type {
	PaymentMethod,
	PaymentResult,
	PaymentService,
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
 * {@link PaymentService} backed by the SumUp wrapper module. Logging in is shared and
 * de-duplicated: the first `prepare()`/`pay()` starts one login and everyone awaits it.
 */
export class SumUpPaymentService implements PaymentService {
	private loginPromise: Promise<unknown> | null = null;

	private ensureLoggedIn(): Promise<unknown> {
		if (!this.loginPromise) {
			this.loginPromise = SumUp.login(
				SUMUP_ACCESS_TOKEN,
				SUMUP_AFFILIATE_KEY,
			).catch((error) => {
				this.loginPromise = null; // let the next call retry
				throw error;
			});
		}
		return this.loginPromise;
	}

	async prepare(): Promise<void> {
		await this.ensureLoggedIn();
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
}
