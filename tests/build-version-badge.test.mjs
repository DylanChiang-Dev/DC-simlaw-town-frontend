import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const packageJson = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const appSource = readFileSync(join(root, 'src', 'App.tsx'), 'utf8');
const stylesSource = readFileSync(join(root, 'src', 'styles.css'), 'utf8');
const badgeSource = readFileSync(join(root, 'src', 'components', 'BuildVersionBadge.tsx'), 'utf8');
const buildInfoPath = join(root, 'src', 'generated', 'buildInfo.ts');
const bumpScriptPath = join(root, 'scripts', 'bump-version.mjs');

assert.equal(
  packageJson.scripts['version:bump'],
  'node scripts/bump-version.mjs',
  'package.json should expose a version:bump command for controlled release increments.',
);

assert.ok(
  existsSync(bumpScriptPath),
  'frontend-v2/scripts/bump-version.mjs should exist.',
);

assert.ok(
  existsSync(buildInfoPath),
  'Generated build info should exist so the frontend can display the committed version.',
);

const buildInfoSource = readFileSync(buildInfoPath, 'utf8');

assert.match(
  buildInfoSource,
  /export const APP_VERSION = '\d+\.\d+\.\d+';/,
  'buildInfo.ts should export a semver APP_VERSION.',
);

assert.match(
  buildInfoSource,
  /export const APP_VERSION_TIME = '\d{4}-\d{2}-\d{2} \d{2}:\d{2} CST';/,
  'buildInfo.ts should export a CST build timestamp.',
);

assert.match(
  buildInfoSource,
  /export const APP_VERSION_LABEL = `v\$\{APP_VERSION\} · \$\{APP_VERSION_TIME\}`;/,
  'buildInfo.ts should expose the fixed user-facing version label format.',
);

assert.match(
  appSource,
  /import \{ BuildVersionBadge \} from '\.\/components\/BuildVersionBadge';/,
  'App should import the build version badge component.',
);

assert.match(
  appSource,
  /<BuildVersionBadge \/>/,
  'App should render the version badge so it remains visible across login and app shells.',
);

assert.match(
  stylesSource,
  /\.build-version-badge\s*\{[\s\S]*position:\s*fixed[\s\S]*left:\s*10px[\s\S]*bottom:\s*58px[\s\S]*z-index:\s*8/,
  'The version badge should be fixed near the lower-left corner above the lifecycle rail and below modal layers.',
);

assert.match(
  badgeSource,
  /buildApiUrl\('\/api\/status'\)/,
  'The version badge should fetch /api/status so it can show the deployed backend version.',
);

assert.match(
  badgeSource,
  /import \{ APP_VERSION, APP_VERSION_TIME \} from '\.\.\/generated\/buildInfo';/,
  'The version badge should render frontend version and timestamp in separate aligned columns.',
);

assert.match(
  badgeSource,
  /backend_version\?: string;[\s\S]*backend_version_time\?: string/,
  'The version badge should read backend version and timestamp separately from /api/status.',
);

assert.match(
  stylesSource,
  /\.build-version-line\s*\{[\s\S]*display:\s*grid[\s\S]*grid-template-columns:\s*2em minmax\(4\.6em,\s*auto\) 1fr[\s\S]*column-gap:\s*6px/,
  'Each version line should use a three-column grid so frontend/backend version text aligns.',
);

assert.match(
  stylesSource,
  /\.build-version-number\s*\{[\s\S]*text-align:\s*left[\s\S]*white-space:\s*nowrap/,
  'Version numbers should align in their own non-wrapping column.',
);
