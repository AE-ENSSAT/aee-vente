import type { SellGridRepository } from '@/src/domain/SellGridRepository';
import { ApiSellGridRepository } from './ApiSellGridRepository';

/**
 * Composition root for data access. `DummySellGridRepository` is still in the tree: bind it
 * here instead to run the sell screen with no backend.
 */
export const sellGridRepository: SellGridRepository =
	new ApiSellGridRepository();
