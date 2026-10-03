/**
 * DISABLED — this test could never run and never did.
 *
 * Problems, all independent:
 *   1. It required `../src/skill-sharing/immersive-learning.js`, which does not
 *      exist. There is no `skill-sharing` directory in `server/src/`.
 *   2. It used `node:test`, but this is a Jest project whose `testMatch` is
 *      `['**/*.spec.ts', '**/*.test.ts']` — `.js` files are never collected.
 *
 * So the assertion it was making was never executed by any runner, which is
 * worse than a failing test: it looked like coverage.
 *
 * Why it is not simply deleted: the client component
 * `client/src/components/skill-sharing/SkillSharingCommunities.tsx` is a
 * complete 428-line UI in the primary nav that calls `GET /skill-sharing`,
 * `/skill-sharing/user/my-memberships`, and `/skill-sharing/:id/exchanges`.
 * All three 404 today, and the component swallows the error into
 * `console.error`, so a user sees an empty list that is indistinguishable
 * from "you have no communities".
 *
 * To revive: either build the server-side `SkillSharingModule` (a real
 * cut-list decision — see ROADMAP.md §2/§6), or de-route
 * `/skill-sharing` in `client/src/App.tsx` and drop the nav entry. Then this
 * assertion has something real to test.
 */

module.exports = { DISABLED: true };
