import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
	ActivityIndicator,
	Pressable,
	StyleSheet,
	Text,
	View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { transactionStore } from '@/src/data/transactionStore';
import { useAuth } from '@/src/presentation/auth/AuthContext';
import { FONT } from '@/src/presentation/theme';

/**
 * Login screen — no credential fields: the seller goes to Keycloak's own page in a system
 * browser session (SSO + PKCE), so the app never handles a password.
 *
 * On success they land on the association picker; only a restored session goes straight to
 * the sell page.
 */
export default function LoginScreen() {
	const router = useRouter();
	const { status, needsTenantChoice, signIn } = useAuth();
	const [busy, setBusy] = useState(false);

	// A restored (or just established) session skips this screen.
	useEffect(() => {
		if (status === 'signedIn') {
			router.replace(needsTenantChoice ? '/tenant' : '/sell');
		}
	}, [status, needsTenantChoice, router]);

	const logIn = async () => {
		if (busy) {
			return;
		}
		setBusy(true);
		try {
			const signedIn = await signIn();
			if (signedIn) {
				// On login rather than sign-out: that also covers a session that ended in a crash.
				await transactionStore.clear();
			}
		} catch {
			// Keycloak reports sign-in problems on its own page, and dismissing it is a choice,
			// not a failure — so there is nothing to surface here.
		} finally {
			setBusy(false);
		}
	};

	// Resuming a stored session — don't flash the button at a seller who is still signed in.
	if (status === 'loading') {
		return (
			<SafeAreaView style={[styles.safe, styles.center]}>
				<ActivityIndicator color="#A91B3A" />
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
			<View style={styles.container}>
				<Text style={styles.title}>AEE Vente</Text>
				<Text style={styles.subtitle}>Connectez-vous pour vendre</Text>

				<Pressable
					style={[styles.button, busy && styles.buttonBusy]}
					onPress={logIn}
					disabled={busy}
					accessibilityRole="button"
				>
					{busy ? (
						<ActivityIndicator color="#ffffff" />
					) : (
						<Text style={styles.buttonText}>Se connecter</Text>
					)}
				</Pressable>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safe: { flex: 1, backgroundColor: '#FAF7F2' },
	center: { alignItems: 'center', justifyContent: 'center' },
	container: { flex: 1, justifyContent: 'center', padding: 24, gap: 14 },
	title: {
		fontSize: 34,
		fontFamily: FONT.black,
		color: '#A91B3A',
		letterSpacing: 0.3,
	},
	subtitle: {
		fontSize: 16,
		fontFamily: FONT.regular,
		color: '#4A4A4A',
		marginBottom: 12,
	},
	button: {
		marginTop: 8,
		backgroundColor: '#A91B3A',
		paddingVertical: 16,
		borderRadius: 12,
		alignItems: 'center',
		// Fixed height so swapping the label for a spinner doesn't resize the button.
		justifyContent: 'center',
		minHeight: 54,
	},
	buttonBusy: { opacity: 0.7 },
	buttonText: {
		color: '#ffffff',
		fontSize: 16,
		fontFamily: FONT.bold,
	},
});
