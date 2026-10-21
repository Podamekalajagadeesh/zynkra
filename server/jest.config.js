module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/test'],
  testMatch: ['**/*.spec.ts', '**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
transform: {
    '^.+\.tsx?$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.json', diagnostics: {
      // `src/features/*` is unregistered facade (none of it is in
      // app.module.ts) that is scheduled for a wire-up-or-delete audit. It
      // still sits in the *type* graph via imports, so ts-jest otherwise
      // fails unrelated test suites on its pre-existing type errors. Errors
      // everywhere else still fail the run. Do not widen this list without
      // fixing the underlying types first.
      exclude: ['**/src/features/**'],
    } }],
  },
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  moduleNameMapper: {
    // archiver@8 is ESM-only, but Jest runs this repo's suites as CommonJS on
    // CI's Node 20, where require()ing it aborts the whole suite at import
    // time. A load-only stand-in lives at test/jest-mocks/archiver.js — read
    // its header before touching this entry.
    '^archiver$': '<rootDir>/test/jest-mocks/archiver.js',
  },
  // `/src/federation/` used to be listed here. Note this entry was mostly inert:
  // every npm script passes `--testPathIgnorePatterns` (`test:unit` and
  // `test:coverage` with `/test/`, `test:integration` with `/src/`), and a CLI
  // flag *replaces* the configured array rather than merging with it. So the
  // exclusion only ever applied to a bare `npx jest` invocation.
  //
  // Federation still had zero collected coverage, for the real reason: its only
  // test was `federation.service.test.js`, and `testMatch` is `['**\/*.spec.ts',
  // '**\/*.test.ts']` — no runner ever collected a `.js` test. That file was also
  // stale, constructing the service with 6 arguments against a constructor that
  // now takes 8, so it could not have passed as written. It is now
  // `federation.service.spec.ts`, ported to Jest, joined by
  // `http-signatures.service.spec.ts`. The exclusion is removed; the obsolete
  // `.js` file has been deleted along with the superseded `.js` tests under
  // `test/` and the redundant CommonJS twins under `src/memories/`.
  // See ROADMAP.md §3 (Phase 4) and §7 item 6.
  coverageReporters: ['text', 'lcov', 'json-summary'],
  // The coverage gate. Enforced natively by `npm run test:coverage` (the
  // Server CI `test-unit` job runs exactly that command), so a regression
  // fails the same step that collects coverage — no separate threshold
  // script to drift out of sync. Metrics are the global percentages Jest
  // computes; the numbers sit just under the measured baseline of
  // lines 75.91 / statements 74.88 / functions 55.38 / branches 62.40
  // (verified identical on CI's Node 20 and Node 26), leaving ~1.5pt of
  // tolerance while locking in the gains over the previous ad-hoc 50% bar.
  // Raise these together with the coverage, never to make a red run green.
  coverageThreshold: {
    global: {
      lines: 75,
      statements: 74,
      functions: 54,
      branches: 61,
    },
  },
};
