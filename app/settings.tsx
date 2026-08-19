import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import {
	Platform,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/src/presentation/auth/AuthContext';
import { useBasket } from '@/src/presentation/basket/BasketContext';
import { FONT, SCREEN_TITLE } from '@/src/presentation/theme';

/** Roles as the API names them, in the wording a seller would recognise. */
const ROLE_LABELS: Record<string, string> = {
	admin: 'Administrateur',
	manager: 'Gestionnaire',
	vendeur: 'Vendeur',
	member: 'Membre',
};

/**
 * Account / settings screen: the seller, then history, the Tap to Pay help page, the
 * association picker, and — last — sign out.
 */
export default function SettingsScreen() {
	const router = useRouter();
	const navigation = useNavigation();
	const { clear } = useBasket();
	const { profile, tenant, user, signOut } = useAuth();

	const disconnect = async () => {
		// RESET rather than replace, so the login screen becomes a fresh root and a back
		// gesture can't return to the app. History is wiped on the next login.
		clear();
		await signOut();
		// Cast: expo-router types `reset` route names as `never` for a generic param list.
		navigation.reset({ index: 0, routes: [{ name: 'index' as never }] });
	};

	// The API knows sellers only by their login handle; the real name lives in Keycloak.
	// The chain degrades a step at a time, so the header is never blank.
	const sellerName =
		[user?.givenName, user?.familyName].filter(Boolean).join(' ') ||
		user?.name ||
		user?.username ||
		profile?.username ||
		'Vendeur';
	const sellerRole =
		profile?.roles.map((role) => ROLE_LABELS[role] ?? role).join(' · ') ??
		tenant?.name ??
		'';

	return (
		<SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
			<View style={styles.header}>
				<Pressable
					onPress={() => router.back()}
					style={styles.backBtn}
					accessibilityRole="button"
					accessibilityLabel="Retour"
					hitSlop={8}
				>
					<Ionicons name="chevron-back" size={26} color="#1A1A1A" />
				</Pressable>
				<Text style={styles.title}>Réglages</Text>
				<View style={styles.backBtn} />
			</View>

			<ScrollView
				contentContainerStyle={styles.content}
				showsVerticalScrollIndicator={false}
			>
				{/* Seller identity */}
				<View style={styles.profile}>
					<View style={styles.avatar}>
						<Ionicons name="person" size={34} color="#ffffff" />
					</View>
					<View style={styles.profileText}>
						<Text style={styles.name}>{sellerName}</Text>
						{sellerRole ? (
							<Text style={styles.role}>{sellerRole}</Text>
						) : null}
						{tenant ? (
							<Text style={styles.tenant}>{tenant.name}</Text>
						) : null}
					</View>
				</View>

				{/* Menu */}
				<View style={styles.menu}>
					<MenuRow
						icon={
							<Ionicons
								name="receipt-outline"
								size={22}
								color="#A91B3A"
							/>
						}
						label="Historique des transactions"
						onPress={() => router.push('/transactions')}
					/>
					{/* Tap to Pay on iPhone is iOS-only — hide it on Android. */}
					{Platform.OS === 'ios' && (
						<MenuRow
							icon={
								<MaterialIcons
									name="contactless"
									size={22}
									color="#A91B3A"
								/>
							}
							label="Tap to Pay sur iPhone"
							onPress={() => router.push('/tap-to-pay')}
						/>
					)}
					{/* Always available, even to a seller who belongs to a single
					    association: the picker is also where an invite code joins
					    another one. */}
					<MenuRow
						icon={
							<Ionicons
								name="swap-horizontal-outline"
								size={22}
								color="#A91B3A"
							/>
						}
						label="Changer d'association"
						onPress={() => router.push('/tenant')}
					/>
					<MenuRow
						icon={
							<Ionicons
								name="log-out-outline"
								size={22}
								color="#B3261E"
							/>
						}
						label="Se déconnecter"
						destructive
						onPress={disconnect}
					/>
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}

function MenuRow({
	icon,
	label,
	onPress,
	destructive,
}: {
	icon: ReactNode;
	label: string;
	onPress: () => void;
	destructive?: boolean;
}) {
	return (
		<Pressable
			onPress={onPress}
			style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
			accessibilityRole="button"
		>
			<View style={styles.rowIcon}>{icon}</View>
			<Text
				style={[styles.rowLabel, destructive && styles.rowLabelDanger]}
			>
				{label}
			</Text>
			{!destructive && (
				<Ionicons name="chevron-forward" size={20} color="#B8B2A8" />
			)}
		</Pressable>
	);
}

const styles = StyleSheet.create({
	safe: { flex: 1, backgroundColor: '#FAF7F2' },
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: 12,
		paddingVertical: 8,
	},
	backBtn: {
		width: 40,
		height: 40,
		alignItems: 'center',
		justifyContent: 'center',
	},
	title: SCREEN_TITLE,
	content: { padding: 20, gap: 22, paddingBottom: 40 },
	profile: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 16,
		backgroundColor: '#ffffff',
		borderWidth: 1,
		borderColor: '#E5E1DA',
		borderRadius: 16,
		padding: 18,
	},
	avatar: {
		width: 64,
		height: 64,
		borderRadius: 32,
		backgroundColor: '#A91B3A',
		alignItems: 'center',
		justifyContent: 'center',
	},
	profileText: { flex: 1, gap: 3 },
	name: { fontSize: 20, fontFamily: FONT.black, color: '#1A1A1A' },
	role: { fontSize: 14, fontFamily: FONT.regular, color: '#4A4A4A' },
	tenant: { fontSize: 13, fontFamily: FONT.regular, color: '#8A8378' },
	menu: { gap: 10 },
	row: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 14,
		backgroundColor: '#ffffff',
		borderWidth: 1,
		borderColor: '#E5E1DA',
		borderRadius: 14,
		paddingHorizontal: 16,
		paddingVertical: 16,
	},
	rowPressed: { opacity: 0.6 },
	rowIcon: { width: 26, alignItems: 'center' },
	rowLabel: {
		flex: 1,
		fontSize: 16,
		fontFamily: FONT.bold,
		color: '#1A1A1A',
	},
	rowLabelDanger: { color: '#B3261E' },
});
