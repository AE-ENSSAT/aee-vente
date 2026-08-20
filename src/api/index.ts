/**
 * The AEE Manager API layer. `api` is fully typed — one method per `operationId` — so the
 * whole surface is reachable, not just the parts the POS uses today. See CLAUDE.md for how
 * to regenerate [openapi.d.ts](./openapi.d.ts) and [spec.json](./spec.json) together.
 */
export { api } from './client';
export { ApiError, toApiError } from './errors';
export type * from './openapi';
export { apiSession } from './session';
