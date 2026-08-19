import type { AuthService } from './auth/AuthService';
import { KeycloakAuthService } from './auth/KeycloakAuthService';

/**
 * Composition root for authentication — the single binding of the {@link AuthService}
 * interface to its implementation, mirroring `payment.ts` and `repositories.ts`. Swap in a
 * fake here to run the app against the API with a hand-issued token.
 */
export const authService: AuthService = new KeycloakAuthService();
