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
import { BasketProvider } from '@/src/presentation/basket/BasketContext';
import { SumUpProvider } from '@/src/presentation/sumup/SumUpContext';

// Keep the splash up until the Montserrat faces are ready, so no text flashes in the
// system font first.
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
				{/* SumUp session (logs in on mount) wraps the basket so payments are ready. */}
				<SumUpProvider>
					<BasketProvider>
						<Stack screenOptions={{ headerShown: false }} />
					</BasketProvider>
				</SumUpProvider>
			</SafeAreaProvider>
		</GestureHandlerRootView>
	);
}
