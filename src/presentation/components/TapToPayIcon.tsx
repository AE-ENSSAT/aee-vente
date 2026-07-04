import { MaterialIcons } from '@expo/vector-icons';
import { SymbolView } from 'expo-symbols';

interface Props {
	color?: string;
	size?: number;
}

/**
 * The Tap to Pay button glyph. Apple's Tap to Pay on iPhone review guidelines (req 5.5)
 * require the SF Symbol `wave.3.right.circle` / `.fill` when an icon is used on the button
 * — no other glyph (and never the Apple logo) is allowed. `expo-symbols` renders the real
 * system symbol on iOS; the `fallback` is used on Android, where the button drives SumUp's
 * Android Tap to Pay instead (Apple's symbol rule doesn't apply there).
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
