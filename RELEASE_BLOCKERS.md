# Release Blockers and Triage

## Current blockers
- Mobile app packaging is not yet validated end-to-end for external distribution (internal beta prepared).
- API and release documentation should be reviewed with each release candidate.

## Recent resolutions (Week 4)
- Internal beta build prepared and manifest generated: mobile/build-artifacts/internal-beta-release.json (status: internal-beta-ready).
- Offline smoke checks passed locally: `cd client && node scripts/offline-smoke.mjs` returned PASS on 2026-07-06.

## Triage actions
1. Validate the offline smoke suite and capture any failures. (completed)
2. Publish the internal beta build and record evidence in the build artifacts. (completed)
3. Review API/documentation changes before the next release candidate. (completed)
4. Re-run the blocker review after each release candidate.

## Triage actions
1. Validate the offline smoke suite and capture any failures.
2. Publish the internal beta build and record evidence in the build artifacts.
3. Review API/documentation changes before the next release candidate.
4. Re-run the blocker review after each release candidate.
