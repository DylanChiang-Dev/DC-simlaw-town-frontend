import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const stylesSource = readFileSync(join(root, 'src', 'styles.css'), 'utf8');
const ledgerSource = readFileSync(join(root, 'src', 'components', 'TechLedger.tsx'), 'utf8');

assert.match(
  ledgerSource,
  /className="tech-item-main"/,
  'TechLedger should render each runtime capability as a compact single-row item.',
);
assert.match(
  stylesSource,
  /\.tech-item\s*\{[\s\S]*?grid-template-columns:\s*minmax\(0,\s*1fr\)\s+auto;/,
  'Tech item cards should use one-row layout so the full catalog fits in the side rail.',
);
assert.match(
  stylesSource,
  /\.tech-item\s*\{[\s\S]*?padding:\s*5px\s+7px;/,
  'Tech item cards should use compact padding.',
);
assert.match(
  stylesSource,
  /\.runtime-tech-grid\s*\{[\s\S]*?gap:\s*4px;/,
  'Runtime tech groups should use tight vertical spacing.',
);
assert.match(
  stylesSource,
  /\.tech-ledger h2\s*\{[\s\S]*?font-size:\s*13px;/,
  'The panel title should be compact enough for one-screen scanning.',
);
