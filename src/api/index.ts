/**
 * The AEE Manager API layer.
 *
 * `api` is a fully typed client — one method per `operationId` of
 * https://api.aee-manager.bde-enssat.fr/swagger.json — so the whole surface (products,
 * grids, orders, sales, adherents, members, reports…) is reachable from here, not just
 * the parts the POS uses today.
 *
 * Types come from [openapi.d.ts](./openapi.d.ts), regenerated with:
 * `bunx openapicmd typegen https://api.aee-manager.bde-enssat.fr/swagger.json > src/api/openapi.d.ts`
 * (keep [spec.json](./spec.json) — the same document, bundled for the runtime — in step).
 */
export { api } from './client';
export { ApiError, toApiError } from './errors';
export type * from './openapi';
export { apiSession } from './session';
