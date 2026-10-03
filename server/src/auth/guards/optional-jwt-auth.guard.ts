/**
 * Re-export of the canonical optional-auth guard, which lives at
 * `auth/optional-jwt-auth.guard` (already used by `posts.controller.ts` and
 * `others`).
 *
 * This path is kept so `guards/` stays a single place to look for guards, but it
 * must not contain a *second* implementation: two classes both named
 * `OptionalJwtAuthGuard` with different `handleRequest` behavior would be
 * registered separately by Nest, and a controller could silently pick up the
 * wrong one depending on its import path. One implementation, one source of
 * truth, reachable under either path.
 */
export { OptionalJwtAuthGuard } from '../optional-jwt-auth.guard';
