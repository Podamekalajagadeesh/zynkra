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
  // `.js` file is still on disk and still uncollected — it should be deleted.
  // See ROADMAP.md §3 (Phase 4) and §7 item 6.
  coverageReporters: ['text', 'lcov', 'json-summary'],
};
