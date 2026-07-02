import type { ReactNode } from 'react';
import {
	ActivityIndicator,
	Pressable,
	StyleSheet,
	Text,
	type ViewStyle,
} from 'react-native';
import { FONT } from '../theme';

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary';

interface Props {
	label: string;
	onPress: () => void;
	variant?: ButtonVariant;
	disabled?: boolean;
	loading?: boolean;
	icon?: ReactNode;
	style?: ViewStyle;
}

/** Full-width button with three colour variants. Used for the pay actions. */
export function PrimaryButton({
	label,
	onPress,
	variant = 'primary',
	disabled,
	loading,
	icon,
	style,
}: Props) {
	const isDisabled = disabled || loading;
	const dark = variant === 'tertiary';
	return (
		<Pressable
			onPress={onPress}
			disabled={isDisabled}
			style={({ pressed }) => [
				styles.base,
				styles[variant],
				isDisabled && styles.disabled,
				pressed && styles.pressed,
				style,
			]}
		>
			{loading ? (
				<ActivityIndicator color={dark ? '#1A1A1A' : '#ffffff'} />
			) : (
				<>
					{icon}
					<Text style={[styles.label, dark && styles.labelDark]}>
						{label}
					</Text>
				</>
			)}
		</Pressable>
	);
}

const styles = StyleSheet.create({
	base: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 10,
		paddingVertical: 16,
		borderRadius: 14,
		width: '100%',
	},
	primary: { backgroundColor: '#A91B3A' },
	secondary: { backgroundColor: '#96275E' },
	tertiary: { backgroundColor: '#E5E1DA' },
	disabled: { opacity: 0.5 },
	pressed: { opacity: 0.85 },
	label: { color: '#ffffff', fontSize: 16, fontFamily: FONT.bold },
	labelDark: { color: '#1A1A1A' },
});
