import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
	Keyboard,
	KeyboardAvoidingView,
	Platform,
	Pressable,
	StyleSheet,
	Text,
	TextInput,
	TouchableWithoutFeedback,
	View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { transactionStore } from '@/src/data/transactionStore';
import { FONT } from '@/src/presentation/theme';

/**
 * Dummy login screen. Authentication is not implemented yet — any input enters the
 * app. (The real SumUp session is established separately by SumUpProvider.)
 */
export default function LoginScreen() {
	const router = useRouter();
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');

	const logIn = async () => {
		// Start each session with a clean history. Doing this on login (rather than on
		// sign-out) is more reliable — it also covers a previous session that ended in a
		// crash or force-quit without a proper sign-out.
		await transactionStore.clear();
		router.replace('/sell');
	};

	return (
		<SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
			{/* Shrinks the content area when the keyboard opens so the centered
			    layout re-centers in the space above it — on both platforms. */}
			<KeyboardAvoidingView
				style={styles.flex}
				behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
			>
				<TouchableWithoutFeedback
					onPress={Keyboard.dismiss}
					accessible={false}
				>
					<View style={styles.container}>
						<Text style={styles.title}>AEE Vente</Text>
						<Text style={styles.subtitle}>
							Connectez-vous pour vendre
						</Text>

						<TextInput
							style={styles.input}
							placeholder="Email"
							placeholderTextColor="#4A4A4A"
							autoCapitalize="none"
							keyboardType="email-address"
							value={email}
							onChangeText={setEmail}
						/>
						<TextInput
							style={styles.input}
							placeholder="Mot de passe"
							placeholderTextColor="#4A4A4A"
							secureTextEntry
							value={password}
							onChangeText={setPassword}
						/>

						<Pressable style={styles.button} onPress={logIn}>
							<Text style={styles.buttonText}>Se connecter</Text>
						</Pressable>
					</View>
				</TouchableWithoutFeedback>
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safe: { flex: 1, backgroundColor: '#FAF7F2' },
	flex: { flex: 1 },
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
	input: {
		borderWidth: 1,
		borderColor: '#E5E1DA',
		borderRadius: 12,
		paddingHorizontal: 16,
		paddingVertical: 14,
		fontSize: 14,
		fontFamily: FONT.regular,
		color: '#1A1A1A',
		backgroundColor: '#ffffff',
	},
	button: {
		marginTop: 8,
		backgroundColor: '#A91B3A',
		paddingVertical: 16,
		borderRadius: 12,
		alignItems: 'center',
	},
	buttonText: {
		color: '#ffffff',
		fontSize: 16,
		fontFamily: FONT.bold,
	},
});
