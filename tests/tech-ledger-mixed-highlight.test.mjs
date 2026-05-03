import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const ledgerSource = readFileSync(join(root, 'src', 'components', 'TechLedger.tsx'), 'utf8');
const stylesSource = readFileSync(join(root, 'src', 'styles.css'), 'utf8');

assert.match(
  ledgerSource,
  /runtime-tech-recent/,
  'TechLedger should render a compact recent-running strip for the latest active Tool or Skill.',
);
assert.match(
  ledgerSource,
  /hasActiveExtension/,
  'TechLedger should detect when an extension Tool is currently active.',
);
assert.match(
  ledgerSource,
  /extensionsOpen\s*\|\|\s*hasActiveExtension/,
  'Extension Tools should become visible automatically while one of them is active.',
);
assert.match(
  ledgerSource,
  /getRuntimeTechDisplayName\(id\)/,
  'Recent-running labels should reuse catalog/fallback display names.',
);

for (const forbidden of ['simulated', '演示调用', '真实调用']) {
  assert.doesNotMatch(
    ledgerSource,
    new RegExp(forbidden),
    `Frontend Tool/Skill panel should not expose ${forbidden} source labels.`,
  );
}

assert.match(
  stylesSource,
  /\.runtime-tech-recent\s*\{/,
  'Recent-running strip should have dedicated compact styling.',
);
assert.match(
  stylesSource,
  /\.runtime-tech-collapsible\.auto-open\s*\{/,
  'Auto-opened extension group should have a visible but compact active state.',
);
assert.match(
  stylesSource,
  /\.tech-item\.active\s*\{[\s\S]*?animation:\s*techPulse\s+1\.15s/,
  'Active Tool/Skill items should keep the stronger pulse treatment.',
);
