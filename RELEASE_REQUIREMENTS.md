# Release Requirements

## API and integration requirements
- Backend API must be reachable at `/api` and must pass the server smoke and QA suites.
- Client release validation must include the offline smoke suite and the standard client build/lint steps.
- Mobile releases must generate a build manifest and accompany the internal beta package with release notes.

## Release gate checklist
1. Run `cd server && npm run qa:check`.
2. Run `cd client && npm run smoke:offline && npm run build`.
3. Run `cd mobile && npm run beta:internal`.
4. Review the current blocker triage in [RELEASE_BLOCKERS.md](RELEASE_BLOCKERS.md).

## Evidence and quick commands
- Offline smoke (validated):

```bash
cd client
node scripts/offline-smoke.mjs
```

- Internal mobile beta manifest (generated): `mobile/build-artifacts/internal-beta-release.json`.

- To regenerate the internal beta artifacts:

```bash
cd mobile
node scripts/publish-beta-build.mjs
```

Record the generated manifest and build-manifest.json in the release ticket.

## Deployment notes
- Keep secrets and environment variables out of source control.
- Publish from a tagged release branch after validation is complete.
- Capture the release hash and build artifact manifest in the release ticket.
