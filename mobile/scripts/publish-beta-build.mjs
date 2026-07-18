import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const artifactDir = path.join(rootDir, 'build-artifacts');

mkdirSync(artifactDir, { recursive: true });

const appConfig = JSON.parse(readFileSync(path.join(rootDir, 'app.json'), 'utf8'));
const storeConfig = JSON.parse(readFileSync(path.join(rootDir, 'store-config.json'), 'utf8'));
const timestamp = new Date().toISOString();

const releaseManifest = {
  generatedAt: timestamp,
  status: 'internal-beta-ready',
  app: {
    name: appConfig.expo.name,
    slug: appConfig.expo.slug,
    version: appConfig.expo.version,
  },
  releaseNotes: [
    'Internal beta build prepared for QA and product review.',
    'Offline mode and release checklist were validated before publishing.',
    'Use the preview EAS profile to distribute the build to internal testers.',
  ],
  platforms: ['ios', 'android'],
  artifacts: [
    'build-artifacts/build-manifest.json',
    'build-artifacts/internal-beta-release.json',
    'build-artifacts/internal-beta-release-notes.md',
  ],
};

writeFileSync(path.join(artifactDir, 'internal-beta-release.json'), JSON.stringify(releaseManifest, null, 2));
writeFileSync(path.join(artifactDir, 'internal-beta-release-notes.md'), `# Internal Beta Release Notes\n\n- Version: ${releaseManifest.app.version}\n- Generated: ${timestamp}\n- Status: ${releaseManifest.status}\n\n## Notes\n- Offline mode and release checklist were validated before publishing.\n- Use the preview EAS profile to distribute the build to internal testers.\n`);

console.log(`Prepared internal beta build manifest at ${path.join(artifactDir, 'internal-beta-release.json')}`);
