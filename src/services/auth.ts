import type { AuthService } from './auth/AuthService';
import { KeycloakAuthService } from './auth/KeycloakAuthService';

/** Composition root for authentication — the one binding of {@link AuthService}. */
export const authService: AuthService = new KeycloakAuthService();
