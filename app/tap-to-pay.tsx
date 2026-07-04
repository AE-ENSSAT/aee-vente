import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
	Alert,
	Platform,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrimaryButton } from '@/src/presentation/components/PrimaryButton';
import { useSumUp } from '@/src/presentation/sumup/SumUpContext';
import { FONT } from '@/src/presentation/theme';

const IS_IOS = Platform.OS === 'ios';

/**
 * Tap to Pay on iPhone information / help screen. Reached from the sell page, it is the
 * always-available merchant-education surface Apple's checklist expects outside the checkout
 * flow (req 4.3): it explains accepting contactless cards (4.5), Apple Pay / digital wallets
 * (4.6), PIN entry (4.7), and the fallback when a card can't be read (4.8). "Voir la
 * démonstration" launches Apple's own interactive education (ProximityReaderDiscovery, iOS
 * 18+, req 4.1); "Activer Tap to Pay" enables it outside a sale (req 3.6) and, once the
 * Terms & Conditions are accepted, presents that education right away (req 4.2), then invites
 * the merchant to try a first payment (req 3.9).
 */
export default function TapToPayScreen() {
	const router = useRouter();
	const { activateTapToPay, presentTapToPayEducation } = useSumUp();
	const [busy, setBusy] = useState<null | 'edu' | 'activate'>(null);
	// True once Tap to Pay has been activated in this session — swaps the activate control
	// for the "it's ready, try it out" panel (req 3.9).
	const [activated, setActivated] = useState(false);

	const showDemo = async () => {
		setBusy('edu');
		try {
			await presentTapToPayEducation();
		} catch {
			// iOS < 18 (or unavailable): the written guide above already covers the steps.
			Alert.alert(
				'Démonstration interactive indisponible',
				"La démonstration d'Apple nécessite iOS 18 ou une version ultérieure. Les explications ci-dessus décrivent la marche à suivre.",
			);
		} finally {
			setBusy(null);
		}
	};

	const activate = async () => {
		setBusy('activate');
		try {
			const status = await activateTapToPay();
			if (status.activated) {
				setActivated(true);
				// Req 4.2: once the Terms & Conditions are accepted, present Apple's
				// merchant education right away. Best-effort — it needs iOS 18+, and the
				// written guide above is the fallback, so a failure is silently ignored.
				try {
					await presentTapToPayEducation();
				} catch {
					// iOS < 18 or unavailable — the on-screen guide already covers it.
				}
			} else {
				Alert.alert(
					'Tap to Pay sur iPhone',
					"L'activation n'a pas été finalisée. Vous pourrez réessayer à tout moment.",
				);
			}
		} catch (e) {
			Alert.alert(
				'Activation impossible',
				e instanceof Error ? e.message : String(e),
			);
		} finally {
			setBusy(null);
		}
	};

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
				<Text style={styles.title} numberOfLines={1}>
					Tap to Pay sur iPhone
				</Text>
				{/* Spacer to keep the title centered against the back button. */}
				<View style={styles.backBtn} />
			</View>

			<ScrollView
				contentContainerStyle={styles.content}
				showsVerticalScrollIndicator={false}
			>
				<Text style={styles.intro}>
					Encaissez une carte bancaire ou un paiement mobile
					directement avec votre iPhone, sans terminal — grâce à Tap
					to Pay sur iPhone.
				</Text>

				<Text style={styles.sectionLabel}>Comment encaisser</Text>

				<EduRow
					icon={
						<MaterialIcons
							name="contactless"
							size={24}
							color="#A91B3A"
						/>
					}
					title="Cartes sans contact"
					text="Présentez la carte sans contact du client à plat contre le haut de l'iPhone, près de l'appareil photo, et maintenez-la jusqu'à la confirmation."
				/>
				<EduRow
					icon={
						<Ionicons
							name="phone-portrait-outline"
							size={24}
							color="#A91B3A"
						/>
					}
					title="Apple Pay et portefeuilles numériques"
					text="Le client peut aussi payer avec Apple Pay ou un autre portefeuille numérique (iPhone ou Apple Watch) de la même manière, en approchant son appareil."
				/>
				<EduRow
					icon={
						<Ionicons
							name="keypad-outline"
							size={24}
							color="#A91B3A"
						/>
					}
					title="Saisie du code PIN"
					text="Pour certains paiements (notamment au-dessus de 50 €), le client saisit son code PIN sur l'écran de l'iPhone. Un mode d'accessibilité est proposé pour la saisie du code."
				/>
				<EduRow
					icon={
						<Ionicons
							name="bluetooth-outline"
							size={24}
							color="#A91B3A"
						/>
					}
					title="Si une carte ne peut pas être lue"
					text="Si le paiement sans contact échoue, utilisez le terminal de paiement Bluetooth ou un autre moyen (espèces) comme solution de repli."
				/>

				{IS_IOS && (
					<View style={styles.actions}>
						{activated ? (
							<>
								<View style={styles.readyCard}>
									<Ionicons
										name="checkmark-circle"
										size={30}
										color="#16875A"
									/>
									<Text style={styles.readyTitle}>
										Tap to Pay sur iPhone est prêt
									</Text>
									<Text style={styles.readyText}>
										Vous pouvez encaisser un paiement sans
										contact directement avec cet iPhone.
										Faites un premier essai dès maintenant.
									</Text>
								</View>
								<PrimaryButton
									label="Encaisser un paiement"
									variant="primary"
									onPress={() => router.dismissTo('/sell')}
									icon={
										<MaterialIcons
											name="contactless"
											size={22}
											color="#ffffff"
										/>
									}
								/>
								<PrimaryButton
									label="Voir la démonstration Apple"
									variant="secondary"
									loading={busy === 'edu'}
									onPress={showDemo}
									icon={
										<Ionicons
											name="play-circle-outline"
											size={20}
											color="#ffffff"
										/>
									}
								/>
							</>
						) : (
							<>
								<PrimaryButton
									label="Voir la démonstration Apple"
									variant="primary"
									loading={busy === 'edu'}
									onPress={showDemo}
									icon={
										<Ionicons
											name="play-circle-outline"
											size={20}
											color="#ffffff"
										/>
									}
								/>
								<PrimaryButton
									label="Activer Tap to Pay sur iPhone"
									variant="secondary"
									loading={busy === 'activate'}
									onPress={activate}
									icon={
										<Ionicons
											name="card-outline"
											size={20}
											color="#ffffff"
										/>
									}
								/>
								<Text style={styles.note}>
									L'activation ouvre l'écran d'Apple pour
									accepter les conditions de Tap to Pay sur
									iPhone. Elle n'est demandée qu'une seule
									fois par appareil.
								</Text>
							</>
						)}
					</View>
				)}
			</ScrollView>
		</SafeAreaView>
	);
}

function EduRow({
	icon,
	title,
	text,
}: {
	icon: React.ReactNode;
	title: string;
	text: string;
}) {
	return (
		<View style={styles.row}>
			<View style={styles.rowIcon}>{icon}</View>
			<View style={styles.rowBody}>
				<Text style={styles.rowTitle}>{title}</Text>
				<Text style={styles.rowText}>{text}</Text>
			</View>
		</View>
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
	title: {
		flex: 1,
		textAlign: 'center',
		fontSize: 18,
		fontFamily: FONT.black,
		color: '#A91B3A',
		letterSpacing: 0.2,
	},
	content: { padding: 20, gap: 14, paddingBottom: 40 },
	intro: {
		fontSize: 16,
		fontFamily: FONT.regular,
		color: '#4A4A4A',
		lineHeight: 23,
	},
	sectionLabel: {
		fontSize: 13,
		fontFamily: FONT.bold,
		color: '#96275E',
		textTransform: 'uppercase',
		letterSpacing: 0.8,
		marginTop: 6,
	},
	row: {
		flexDirection: 'row',
		gap: 14,
		backgroundColor: '#ffffff',
		borderWidth: 1,
		borderColor: '#E5E1DA',
		borderRadius: 14,
		padding: 16,
	},
	rowIcon: { width: 28, alignItems: 'center', paddingTop: 2 },
	rowBody: { flex: 1, gap: 4 },
	rowTitle: { fontSize: 16, fontFamily: FONT.bold, color: '#1A1A1A' },
	rowText: {
		fontSize: 14,
		fontFamily: FONT.regular,
		color: '#4A4A4A',
		lineHeight: 20,
	},
	actions: { gap: 10, marginTop: 10 },
	readyCard: {
		alignItems: 'center',
		gap: 8,
		backgroundColor: '#E4F4EC',
		borderWidth: 1,
		borderColor: '#BFE6D2',
		borderRadius: 14,
		padding: 18,
		marginBottom: 2,
	},
	readyTitle: {
		fontSize: 17,
		fontFamily: FONT.bold,
		color: '#0F6B45',
		textAlign: 'center',
	},
	readyText: {
		fontSize: 14,
		fontFamily: FONT.regular,
		color: '#2F5D49',
		textAlign: 'center',
		lineHeight: 20,
	},
	note: {
		fontSize: 13,
		fontFamily: FONT.regular,
		color: '#767676',
		lineHeight: 18,
		textAlign: 'center',
		paddingHorizontal: 8,
		marginTop: 2,
	},
});
