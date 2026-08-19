import type { SellGridRepository } from '@/src/domain/SellGridRepository';
import { ApiSellGridRepository } from './ApiSellGridRepository';

/**
 * Composition root for data access — the one place that binds domain interfaces to
 * concrete implementations.
 *
 * Grids now come from the AEE Manager API. `DummySellGridRepository` is still in the tree:
 * bind it here instead to run the sell screen with no backend (offline demo, UI work).
 */
export const sellGridRepository: SellGridRepository =
	new ApiSellGridRepository();
