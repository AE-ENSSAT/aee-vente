import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
	ActivityIndicator,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { MyTenantDto } from '@/src/api';
import { useAuth } from '@/src/presentation/auth/AuthContext';
import { FONT } from '@/src/presentation/theme';

/** Roles as the API names them, in the wording a seller would recognise. */
const ROLE_LABELS: Record<string, string> = {
	admin: 'Administrateur',
	manager: 'Gestionnaire',
	vendeur: 'Vendeur',
	member: 'Membre',
};

const rolesLabel = (roles: MyTenantDto['roles']): string =>
	roles.map((role) => ROLE_LABELS[role] ?? role).join(' · ');

/**
 * Association picker, shown after **every** sign-in — every API call is scoped to exactly
 * one tenant (`X-Tenant-Id`), so one must be settled on before selling. A seller with a
 * single membership passes through here too: the POS is handed between sellers, and which
 * association a shift's takings land in is worth one tap to confirm. Only a session
 * *resumed* at start-up skips it (see `AuthContext.loadSession`).
 *
 * It doubles as the way in for a seller who belongs to none yet: an invite code joins an
 * association and switches to it.
 */
export default function TenantScreen() {
	const router = useRouter();
	const { tenants, tenant, selectTenant, joinTenant } = useAuth();
	const [busyId, setBusyId] = useState<string | null>(null);
	const [code, setCode] = useState('');
	const [joining, setJoining] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const choose = async (tenantId: string) => {
		setBusyId(tenantId);
		setError(null);
		try {
			await selectTenant(tenantId);
			router.replace('/sell');
		} catch (e) {
			setError(e instanceof Error ? e.message : String(e));
		} finally {
			setBusyId(null);
		}
	};

	const join = async () => {
		if (joining || !code.trim()) {
			return;
		}
		setJoining(true);
		setError(null);
		try {
			await joinTenant(code.trim());
			router.replace('/sell');
		} catch (e) {
			setError(e instanceof Error ? e.message : String(e));
		} finally {
			setJoining(false);
		}
	};

	return (
		<SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
			<ScrollView contentContainerStyle={styles.content}>
				<Text style={styles.title}>Choisir l'association</Text>
				<Text style={styles.subtitle}>
					{tenants.length
						? 'Vos ventes seront enregistrées pour cette association.'
						: "Vous n'appartenez à aucune association. Saisissez un code d'invitation."}
				</Text>

				{tenants.map((item) => {
					const active = item.tenantId === tenant?.tenantId;
					return (
						<Pressable
							key={item.tenantId}
							style={({ pressed }) => [
								styles.row,
								active && styles.rowActive,
								pressed && styles.rowPressed,
							]}
							onPress={() => choose(item.tenantId)}
							disabled={busyId !== null}
							accessibilityRole="button"
						>
							<View style={styles.rowText}>
								<Text style={styles.name}>{item.name}</Text>
								<Text style={styles.roles}>
									{rolesLabel(item.roles)}
								</Text>
							</View>
							{busyId === item.tenantId ? (
								<ActivityIndicator color="#A91B3A" />
							) : (
								<Ionicons
									name={
										active
											? 'checkmark-circle'
											: 'chevron-forward'
									}
									size={22}
									color={active ? '#A91B3A' : '#B8B2A8'}
								/>
							)}
						</Pressable>
					);
				})}

				<View style={styles.joinBlock}>
					<Text style={styles.joinTitle}>Rejoindre avec un code</Text>
					<View style={styles.joinRow}>
						<TextInput
							style={styles.input}
							placeholder="Code d'invitation"
							placeholderTextColor="#4A4A4A"
							keyboardType="number-pad"
							value={code}
							onChangeText={setCode}
							editable={!joining}
						/>
						<Pressable
							style={[
								styles.joinBtn,
								(joining || !code.trim()) && styles.joinBtnOff,
							]}
							onPress={join}
							disabled={joining || !code.trim()}
							accessibilityRole="button"
						>
							{joining ? (
								<ActivityIndicator color="#ffffff" />
							) : (
								<Text style={styles.joinBtnText}>
									Rejoindre
								</Text>
							)}
						</Pressable>
					</View>
				</View>

				{error && <Text style={styles.error}>{error}</Text>}
			</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safe: { flex: 1, backgroundColor: '#FAF7F2' },
	content: { padding: 24, gap: 12 },
	title: {
		fontSize: 26,
		fontFamily: FONT.black,
		color: '#A91B3A',
		letterSpacing: 0.3,
	},
	subtitle: {
		fontSize: 15,
		fontFamily: FONT.regular,
		color: '#4A4A4A',
		marginBottom: 8,
	},
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
	rowActive: { borderColor: '#A91B3A' },
	rowPressed: { opacity: 0.6 },
	rowText: { flex: 1, gap: 3 },
	name: { fontSize: 17, fontFamily: FONT.bold, color: '#1A1A1A' },
	roles: { fontSize: 13, fontFamily: FONT.regular, color: '#4A4A4A' },
	joinBlock: { marginTop: 20, gap: 10 },
	joinTitle: { fontSize: 15, fontFamily: FONT.bold, color: '#1A1A1A' },
	joinRow: { flexDirection: 'row', gap: 10 },
	input: {
		flex: 1,
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
	joinBtn: {
		backgroundColor: '#A91B3A',
		borderRadius: 12,
		paddingHorizontal: 20,
		alignItems: 'center',
		justifyContent: 'center',
		minWidth: 110,
	},
	joinBtnOff: { opacity: 0.5 },
	joinBtnText: { color: '#ffffff', fontSize: 15, fontFamily: FONT.bold },
	error: {
		color: '#B3261E',
		fontSize: 14,
		fontFamily: FONT.regular,
		textAlign: 'center',
		marginTop: 8,
	},
});
