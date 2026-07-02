import { useEffect, useState } from 'react';
import { sellGridRepository } from '@/src/data/repositories';
import type { SellGrid } from '@/src/domain/models';

export interface SellGridsState {
	grids: SellGrid[];
	loading: boolean;
	error: string | null;
}

/**
 * Loads sell grids from the {@link sellGridRepository}. The component only sees grids
 * + loading/error; whether they come from dummy data or the API is invisible here.
 */
export function useSellGrids(): SellGridsState {
	const [state, setState] = useState<SellGridsState>({
		grids: [],
		loading: true,
		error: null,
	});

	useEffect(() => {
		let active = true;
		sellGridRepository
			.getSellGrids()
			.then((grids) => {
				if (active) {
					setState({ grids, loading: false, error: null });
				}
			})
			.catch((error) => {
				if (active) {
					setState({
						grids: [],
						loading: false,
						error:
							error instanceof Error
								? error.message
								: String(error),
					});
				}
			});
		return () => {
			active = false;
		};
	}, []);

	return state;
}
