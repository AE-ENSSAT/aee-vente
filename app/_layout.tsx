import {
	Montserrat_400Regular,
	Montserrat_700Bold,
	Montserrat_900Black,
	useFonts,
} from '@expo-google-fonts/montserrat';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '@/src/presentation/auth/AuthContext';
import { SessionGuard } from '@/src/presentation/auth/SessionGuard';
import { BasketProvider } from '@/src/presentation/basket/BasketContext';
import { SumUpProvider } from '@/src/presentation/sumup/SumUpContext';

// Hold the splash until Montserrat is ready, so no text flashes in the system font.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
	const [fontsLoaded] = useFonts({
		Montserrat_400Regular,
		Montserrat_700Bold,
		Montserrat_900Black,
	});

	useEffect(() => {
		if (fontsLoaded) {
			SplashScreen.hideAsync();
		}
	}, [fontsLoaded]);

	if (!fontsLoaded) {
		return null;
	}

	return (
		<GestureHandlerRootView style={{ flex: 1 }}>
			<SafeAreaProvider>
				{/* Outermost app state: the Keycloak session and the selected tenant, which
				    every AEE Manager call is scoped to. */}
				<AuthProvider>
					{/* Watches for a session that lapses mid-use and returns to the login. */}
					<SessionGuard />
					{/* SumUp session (logs in on mount) wraps the basket so payments are ready. */}
					<SumUpProvider>
						<BasketProvider>
							<Stack screenOptions={{ headerShown: false }}>
								<Stack.Screen
									name="transaction/[id]"
									options={({ route }) => {
										const isReceipt =
											(
												route.params as
													| { origin?: string }
													| undefined
											)?.origin === 'receipt';
										// Receipt (from the sell prompt): a full-screen native
										// modal. From history: the normal card push.
										return isReceipt
											? {
													presentation:
														'fullScreenModal',
												}
											: { presentation: 'card' };
									}}
								/>
							</Stack>
						</BasketProvider>
					</SumUpProvider>
				</AuthProvider>
			</SafeAreaProvider>
		</GestureHandlerRootView>
	);
}
