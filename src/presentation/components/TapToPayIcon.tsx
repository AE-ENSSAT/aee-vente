import { MaterialIcons } from '@expo/vector-icons';
import { SymbolView } from 'expo-symbols';

interface Props {
	color?: string;
	size?: number;
}

/**
 * Apple's review guidelines (req 5.5) require the SF Symbol `wave.3.right.circle` on the
 * Tap to Pay button — no other glyph, never the Apple logo. `expo-symbols` renders the real
 * symbol on iOS; the `fallback` covers Android, where the rule doesn't apply.
 */
export function TapToPayIcon({ color = '#ffffff', size = 22 }: Props) {
	return (
		<SymbolView
			name="wave.3.right.circle.fill"
			size={size}
			tintColor={color}
			type="monochrome"
			fallback={
				<MaterialIcons name="contactless" size={size} color={color} />
			}
		/>
	);
}
