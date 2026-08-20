import { useCallback, useEffect, useRef, useState } from 'react';
import { sellGridRepository } from '@/src/data/repositories';
import type { SellGrid } from '@/src/domain/models';
import { useAuth } from '@/src/presentation/auth/AuthContext';

export interface SellGridsState {
	grids: SellGrid[];
	/** A load with nothing to show yet — first render, or a tenant switch. */
	loading: boolean;
	error: string | null;
	/** True while a pull-to-refresh runs; the current grids stay on screen throughout. */
	refreshing: boolean;
	/** Re-read the catalogue — pull down on the grid (prices and products change mid-service). */
	refresh: () => void;
}

/**
 * Loads sell grids from the {@link sellGridRepository}, which the component never sees past.
 * Keyed on the tenant: each association has its own catalogue.
 */
export function useSellGrids(): SellGridsState {
	const { tenant } = useAuth();
	const tenantId = tenant?.tenantId ?? null;
	const [state, setState] = useState<Omit<SellGridsState, 'refresh'>>({
		grids: [],
		loading: true,
		error: null,
		refreshing: false,
	});
	// Stamps each request so only the newest may write: a tenant switch landing mid-refresh
	// must not be overwritten by the older answer.
	const latest = useRef(0);

	const load = useCallback((mode: 'initial' | 'refresh') => {
		const id = ++latest.current;
		setState((prev) =>
			mode === 'refresh'
				? { ...prev, refreshing: true }
				: // Back to a loading state on a tenant switch, so the outgoing
					// catalogue can't be tapped while the new one is on its way.
					{
						grids: [],
						loading: true,
						error: null,
						refreshing: false,
					},
		);
		sellGridRepository
			.getSellGrids()
			.then((grids) => {
				if (id === latest.current) {
					setState({
						grids,
						loading: false,
						error: null,
						refreshing: false,
					});
				}
			})
			.catch((error) => {
				if (id !== latest.current) {
					return;
				}
				const message =
					error instanceof Error ? error.message : String(error);
				setState((prev) =>
					// A failed *refresh* keeps what is on screen: a till mid-service must not go
					// blank because one request timed out.
					mode === 'refresh'
						? { ...prev, refreshing: false, error: message }
						: {
								grids: [],
								loading: false,
								error: message,
								refreshing: false,
							},
				);
			});
	}, []);

	// `tenantId` is a refetch key, not a value the effect reads: the repository takes the
	// tenant from the API session.
	// biome-ignore lint/correctness/useExhaustiveDependencies: deliberate refetch key
	useEffect(() => {
		load('initial');
	}, [load, tenantId]);

	const refresh = useCallback(() => load('refresh'), [load]);

	return { ...state, refresh };
}
