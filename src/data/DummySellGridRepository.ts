import type { SellGrid } from '@/src/domain/models';
import type { SellGridRepository } from '@/src/domain/SellGridRepository';
import { DUMMY_SELL_GRIDS } from './dummySellGrids';

/**
 * In-memory {@link SellGridRepository} backed by {@link DUMMY_SELL_GRIDS}. Adds a
 * small artificial delay so loading states behave like they will against the API.
 */
export class DummySellGridRepository implements SellGridRepository {
	async getSellGrids(): Promise<SellGrid[]> {
		await new Promise((resolve) => setTimeout(resolve, 150));
		return DUMMY_SELL_GRIDS;
	}
}
