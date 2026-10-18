/**
 * Jest stand-in for `archiver` (wired via `moduleNameMapper` in jest.config.js).
 *
 * Why this exists: `archiver@8` is ESM-only (`"type": "module"`, a single
 * `"./index.js"` export). Jest on CI's Node 20 runs suites as CommonJS, and
 * `require()`ing an ESM-only package throws
 *   "Must use import to load ES Module: .../archiver/index.js"
 * before any test in the suite can run — this took down
 * `test/core-loop.db.integration.test.ts`, which reaches `archiver` through
 * AuthModule → ... → account-management.controller → data-export.service.ts,
 * even though the suite never calls a data-export endpoint.
 *
 * Scope: load-time double only. No test in this repo exercises
 * `DataExportService.processExport` (the only caller of `archiver()`), so the
 * fake implements just the surface data-export.service.ts touches so the
 * module graph can load. If a future test DOES drive a zip export, delete
 * this file, remove the moduleNameMapper entry, and solve the ESM loading
 * problem properly (e.g. a Jest version with require(ESM) support, or an
 * archiver version with a CommonJS entry point) — do not grow this fake.
 */

'use strict';

const { EventEmitter } = require('events');

function createZip() {
  const archive = new EventEmitter();
  archive.pipe = (dest) => dest;
  archive.file = () => archive;
  archive.append = () => archive;
  archive.directory = () => archive;
  archive.glob = () => archive;
  archive.pointer = () => 0;
  archive.finalize = async () => archive;
  return archive;
}

module.exports = createZip;
module.exports.default = createZip;
Object.defineProperty(module.exports, '__esModule', { value: true });
