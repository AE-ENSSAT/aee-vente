import type { SellGrid } from './models';

/**
 * Source of sell grids. The presentation layer depends only on this interface, so
 * today's {@link DummySellGridRepository} can be replaced by an API-backed
 * implementation later without changing any screen or component.
 */
export interface SellGridRepository {
	getSellGrids(): Promise<SellGrid[]>;
}
