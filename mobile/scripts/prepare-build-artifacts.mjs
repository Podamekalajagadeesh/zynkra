import { mkdirSync, writeFileSync, readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const artifactDir = path.join(rootDir, 'build-artifacts');
mkdirSync(artifactDir, { recursive: true });

const appConfig = JSON.parse(readFileSync(path.join(rootDir, 'app.json'), 'utf8'));
const storeConfig = JSON.parse(readFileSync(path.join(rootDir, 'store-config.json'), 'utf8'));
const expoConfig = appConfig.expo;
const timestamp = new Date().toISOString();

const manifest = {
  generatedAt: timestamp,
  app: {
    name: expoConfig.name,
    slug: expoConfig.slug,
    version: expoConfig.version,
    bundleIdentifier: expoConfig.ios?.bundleIdentifier,
    packageName: expoConfig.android?.package,
    owner: expoConfig.owner,
  },
  store: storeConfig.metadata,
  versioning: storeConfig.versioning,
  environment: storeConfig.environment,
};

writeFileSync(path.join(artifactDir, 'build-manifest.json'), JSON.stringify(manifest, null, 2));
writeFileSync(path.join(artifactDir, 'README.md'), `# Build Artifacts\n\nGenerated ${timestamp}\n\n- App: ${expoConfig.name}\n- Version: ${expoConfig.version}\n- iOS Bundle ID: ${expoConfig.ios?.bundleIdentifier}\n- Android Package: ${expoConfig.android?.package}\n`);

console.log(`Created mobile build artifacts in ${artifactDir}`);
