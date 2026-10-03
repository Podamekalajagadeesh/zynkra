/**
 * DISABLED — this test could never run and never did.
 *
 * Problems, all independent:
 *   1. It required `../src/cultural-preservation/archive-library.js`, which does
 *      not exist. There is no `cultural-preservation` directory in
 *      `server/src/`.
 *   2. It used `node:test`, but this is a Jest project whose `testMatch` is
 *      `['**/*.spec.ts', '**/*.test.ts']` — `.js` files are never collected.
 *
 * So the assertion it was making was never executed by any runner, which is
 * worse than a failing test: it looked like coverage.
 *
 * Why it is not simply deleted: the client component
 * `client/src/components/cultural-preservation-communities/CulturalPreservationCommunities`
 * is routed at `/cultural-preservation-communities` and listed in the primary
 * nav, with no server-side backing module.
 *
 * To revive: either build the server-side module (a real cut-list decision —
 * see ROADMAP.md §2/§6), or de-route the page in `client/src/App.tsx` and drop
 * the nav entry. Then this assertion has something real to test.
 */

module.exports = { DISABLED: true };
