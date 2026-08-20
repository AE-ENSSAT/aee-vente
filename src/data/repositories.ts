import type { SellGridRepository } from '@/src/domain/SellGridRepository';
import { ApiSellGridRepository } from './ApiSellGridRepository';

/** Composition root for data access — the one binding of {@link SellGridRepository}. */
export const sellGridRepository: SellGridRepository =
	new ApiSellGridRepository();
