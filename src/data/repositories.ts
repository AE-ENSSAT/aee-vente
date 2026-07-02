import type { SellGridRepository } from '@/src/domain/SellGridRepository';
import { DummySellGridRepository } from './DummySellGridRepository';

/**
 * Composition root for data access — the one place that binds domain interfaces to
 * concrete implementations. When the API lands, change `new DummySellGridRepository()`
 * to the API-backed class here; the rest of the app is untouched.
 */
export const sellGridRepository: SellGridRepository =
	new DummySellGridRepository();
