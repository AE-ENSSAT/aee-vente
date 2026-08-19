import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
	ActivityIndicator,
	FlatList,
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
import { PaymentMethodIcon } from '@/src/presentation/components/PaymentMethodIcon';
import { formatEuros } from '@/src/presentation/money';
import { paymentMethodLabel } from '@/src/presentation/paymentMethod';
import { FONT, SCREEN_TITLE } from '@/src/presentation/theme';

/** "04/07 · 14:32" — short, locale-independent. */
function formatDate(timestamp: number): string {
	const d = new Date(timestamp);
	const pad = (n: number) => String(n).padStart(2, '0');
	return `${pad(d.getDate())}/${pad(d.getMonth() + 1)} · ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * Transaction history, from the locally-persisted sales — approved and declined — which are
 * cleared on sign-out.
 */
export default function TransactionsScreen() {
	const router = useRouter();
	const [transactions, setTransactions] = useState<Transaction[] | null>(
		null,
	);

	useEffect(() => {
		let active = true;
		transactionStore.list().then((list) => {
			if (active) {
				setTransactions(list);
			}
		});
		return () => {
			active = false;
		};
	}, []);

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
				<Text style={styles.title}>Historique</Text>
				<View style={styles.backBtn} />
			</View>

			{transactions === null ? (
				<View style={styles.center}>
					<ActivityIndicator color="#A91B3A" />
				</View>
			) : (
				<FlatList
					data={transactions}
					keyExtractor={(t) => t.id}
					contentContainerStyle={styles.list}
					showsVerticalScrollIndicator={false}
					renderItem={({ item }) => (
						<TransactionRow
							transaction={item}
							onPress={() =>
								router.push({
									pathname: '/transaction/[id]',
									params: { id: item.id },
								})
							}
						/>
					)}
					ListEmptyComponent={
						<View style={styles.center}>
							<Ionicons
								name="receipt-outline"
								size={40}
								color="#C9C2B6"
							/>
							<Text style={styles.empty}>
								Aucune transaction pour le moment.
							</Text>
						</View>
					}
				/>
			)}
		</SafeAreaView>
	);
}

function TransactionRow({
	transaction,
	onPress,
}: {
	transaction: Transaction;
	onPress: () => void;
}) {
	return (
		<Pressable
			onPress={onPress}
			style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
			accessibilityRole="button"
		>
			<View style={styles.rowIcon}>
				<PaymentMethodIcon
					method={transaction.method}
					size={22}
					color="#96275E"
				/>
			</View>
			<View style={styles.rowBody}>
				<Text style={styles.rowMethod}>
					{paymentMethodLabel(transaction.method)}
				</Text>
				<View style={styles.rowMeta}>
					<Text style={styles.rowDate}>
						{formatDate(transaction.timestamp)}
					</Text>
					{transaction.status === 'declined' && (
						<Text style={styles.declinedChip}>Refusé</Text>
					)}
				</View>
			</View>
			<Text style={styles.rowAmount}>
				{formatEuros(transaction.amountCents)}
			</Text>
			<Ionicons name="chevron-forward" size={18} color="#C9C2B6" />
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
	center: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		gap: 12,
		paddingTop: 80,
	},
	list: { padding: 20, gap: 10, paddingBottom: 40, flexGrow: 1 },
	empty: {
		textAlign: 'center',
		color: '#4A4A4A',
		fontSize: 15,
		fontFamily: FONT.regular,
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
		paddingVertical: 14,
	},
	rowPressed: { opacity: 0.6 },
	rowIcon: {
		width: 40,
		height: 40,
		borderRadius: 20,
		backgroundColor: '#F3E8EE',
		alignItems: 'center',
		justifyContent: 'center',
	},
	rowBody: { flex: 1, gap: 3 },
	rowMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
	declinedChip: {
		fontSize: 12,
		fontFamily: FONT.bold,
		color: '#CC324C',
		backgroundColor: '#FBE4E8',
		borderRadius: 6,
		paddingHorizontal: 6,
		paddingVertical: 1,
		overflow: 'hidden',
	},
	rowMethod: { fontSize: 15, fontFamily: FONT.bold, color: '#1A1A1A' },
	rowDate: { fontSize: 13, fontFamily: FONT.regular, color: '#767676' },
	rowAmount: { fontSize: 16, fontFamily: FONT.bold, color: '#1A1A1A' },
});
