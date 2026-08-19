import type { SellGrid } from './models';

/** Source of sell grids. Screens depend on this, never on the API client. */
export interface SellGridRepository {
	getSellGrids(): Promise<SellGrid[]>;
}
