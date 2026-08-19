import * as Haptics from 'expo-haptics';

/**
 * Thin, fire-and-forget wrappers around expo-haptics. Haptics are best-effort feedback —
 * unsupported devices simply do nothing — so these never throw or need awaiting.
 */

/** A firm tap, e.g. when a long-press is recognised. */
export function hapticLongPress() {
	Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
}

/** A light tap, e.g. when a pull-to-refresh fires. */
export function hapticRefresh() {
	Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

/** The system "success" notification pattern (payment accepted). */
export function hapticSuccess() {
	Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
		() => {},
	);
}

/** The system "error" notification pattern (payment refused/failed). */
export function hapticError() {
	Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(
		() => {},
	);
}
