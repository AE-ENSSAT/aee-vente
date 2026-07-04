import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
	ActivityIndicator,
	Pressable,
	StyleSheet,
	Text,
	View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
	type Transaction,
	transactionStore,
} from '@/src/data/transactionStore';
import { formatEuros } from '@/src/presentation/money';
import { FONT } from '@/src/presentation/theme';

/** "04/07/2026 · 14:32" */
function formatDateLong(timestamp: number): string {
	const d = new Date(timestamp);
	const pad = (n: number) => String(n).padStart(2, '0');
	return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} · ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * Detail of a single sale, opened by tapping a row in the transaction history. Loads the sale
 * from the local store ({@link transactionStore}) by its id.
 */
export default function TransactionDetailScreen() {
	const router = useRouter();
	const { id } = useLocalSearchParams<{ id: string }>();
	// undefined = loading, null = not found, else the sale.
	const [transaction, setTransaction] = useState<
		Transaction | null | undefined
	>(undefined);

	useEffect(() => {
		let active = true;
		transactionStore.get(id).then((tx) => {
			if (active) {
				setTransaction(tx);
			}
		});
		return () => {
			active = false;
		};
	}, [id]);

	const isTapToPay = transaction?.method === 'tapToPay';

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
				<Text style={styles.title}>Détail</Text>
				<View style={styles.backBtn} />
			</View>

			{transaction === undefined ? (
				<View style={styles.center}>
					<ActivityIndicator color="#A91B3A" />
				</View>
			) : transaction === null ? (
				<View style={styles.center}>
					<Text style={styles.empty}>Transaction introuvable.</Text>
				</View>
			) : (
				<View style={styles.content}>
					{/* Amount + accepted badge */}
					<View style={styles.amountBlock}>
						<Text style={styles.amount}>
							{formatEuros(transaction.amountCents)}
						</Text>
						<View style={styles.accepted}>
							<Ionicons
								name="checkmark-circle"
								size={18}
								color="#16875A"
							/>
							<Text style={styles.acceptedText}>
								Paiement accepté
							</Text>
						</View>
					</View>

					{/* Items */}
					{transaction.lines.length > 0 && (
						<View>
							<Text style={styles.sectionLabel}>Articles</Text>
							<View style={styles.card}>
								{transaction.lines.map((line, i) => (
									<View
										key={`${line.productName}-${line.variantName ?? ''}`}
										style={[
											styles.lineRow,
											i > 0 && styles.lineDivider,
										]}
									>
										<Text style={styles.lineQty}>
											{line.quantity}×
										</Text>
										<View style={styles.lineBody}>
											<Text style={styles.lineName}>
												{line.variantName
													? `${line.productName} – ${line.variantName}`
													: line.productName}
											</Text>
											<Text style={styles.lineUnit}>
												{formatEuros(line.unitCents)} /
												unité
											</Text>
										</View>
										<Text style={styles.lineTotal}>
											{formatEuros(
												line.unitCents * line.quantity,
											)}
										</Text>
									</View>
								))}
							</View>
						</View>
					)}

					{/* Details card */}
					<View style={styles.card}>
						<DetailRow label="Méthode">
							<View style={styles.method}>
								{isTapToPay ? (
									<MaterialIcons
										name="contactless"
										size={18}
										color="#96275E"
									/>
								) : (
									<Ionicons
										name="bluetooth-outline"
										size={18}
										color="#96275E"
									/>
								)}
								<Text style={styles.value}>
									{isTapToPay
										? 'Tap to Pay sur iPhone'
										: 'Terminal de paiement'}
								</Text>
							</View>
						</DetailRow>
						<View style={styles.divider} />
						<DetailRow label="Date">
							<Text style={styles.value}>
								{formatDateLong(transaction.timestamp)}
							</Text>
						</DetailRow>
						<View style={styles.divider} />
						<DetailRow label="Référence">
							<Text
								style={styles.reference}
								numberOfLines={1}
								ellipsizeMode="middle"
							>
								{transaction.id}
							</Text>
						</DetailRow>
					</View>
				</View>
			)}
		</SafeAreaView>
	);
}

function DetailRow({
	label,
	children,
}: {
	label: string;
	children: React.ReactNode;
}) {
	return (
		<View style={styles.detailRow}>
			<Text style={styles.label}>{label}</Text>
			<View style={styles.detailValue}>{children}</View>
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
	center: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		paddingTop: 80,
	},
	empty: { color: '#4A4A4A', fontSize: 15, fontFamily: FONT.regular },
	content: { padding: 20, gap: 24 },
	amountBlock: { alignItems: 'center', gap: 10, paddingVertical: 16 },
	amount: { fontSize: 44, fontFamily: FONT.black, color: '#1A1A1A' },
	accepted: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 6,
		backgroundColor: '#E4F4EC',
		borderRadius: 999,
		paddingHorizontal: 12,
		paddingVertical: 5,
	},
	acceptedText: { fontSize: 14, fontFamily: FONT.bold, color: '#16875A' },
	card: {
		backgroundColor: '#ffffff',
		borderWidth: 1,
		borderColor: '#E5E1DA',
		borderRadius: 16,
		paddingHorizontal: 16,
	},
	detailRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		gap: 16,
		paddingVertical: 16,
	},
	label: { fontSize: 15, fontFamily: FONT.regular, color: '#767676' },
	detailValue: { flex: 1, alignItems: 'flex-end' },
	method: { flexDirection: 'row', alignItems: 'center', gap: 8 },
	value: {
		fontSize: 15,
		fontFamily: FONT.bold,
		color: '#1A1A1A',
		textAlign: 'right',
	},
	reference: {
		flex: 1,
		fontSize: 14,
		fontFamily: FONT.regular,
		color: '#1A1A1A',
		textAlign: 'right',
	},
	divider: { height: 1, backgroundColor: '#EFEBE4' },
	sectionLabel: {
		fontSize: 13,
		fontFamily: FONT.bold,
		color: '#96275E',
		textTransform: 'uppercase',
		letterSpacing: 0.8,
		marginBottom: 10,
	},
	lineRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
		paddingVertical: 14,
	},
	lineDivider: { borderTopWidth: 1, borderTopColor: '#EFEBE4' },
	lineQty: {
		minWidth: 34,
		fontSize: 15,
		fontFamily: FONT.bold,
		color: '#1A1A1A',
	},
	lineBody: { flex: 1, gap: 2 },
	lineName: { fontSize: 15, fontFamily: FONT.bold, color: '#1A1A1A' },
	lineUnit: { fontSize: 13, fontFamily: FONT.regular, color: '#767676' },
	lineTotal: { fontSize: 15, fontFamily: FONT.bold, color: '#1A1A1A' },
});
