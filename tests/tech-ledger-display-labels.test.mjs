import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const helperPath = join(root, 'src', 'components', 'techDisplayNames.ts');
const ledgerSource = readFileSync(join(root, 'src', 'components', 'TechLedger.tsx'), 'utf8');

assert.ok(
  existsSync(helperPath),
  'TechLedger should use a dedicated display-name helper for runtime tools and skills.',
);

const helperSource = readFileSync(helperPath, 'utf8');

const expectedLabels = {
  load_client_memory: '读取当事人记忆',
  load_lawyer_memory: '读取律师记忆',
  save_client_memory: '写入当事人记忆',
  save_lawyer_memory: '写入律师记忆',
  'client-memory-writing': '当事人记忆写入规则',
  'lawyer-memory-writing': '律师记忆写入规则',
};

for (const [rawName, displayName] of Object.entries(expectedLabels)) {
  assert.match(
    helperSource,
    new RegExp(`['"]${rawName}['"]\\s*:\\s*['"]${displayName}['"]`),
    `${rawName} should render with the Chinese display name "${displayName}".`,
  );
}

assert.match(
  helperSource,
  /displayName \? `\$\{displayName\}（\$\{value\}）` : value/,
  'Known runtime tags should render as Chinese display name followed by the original raw identifier in Chinese parentheses.',
);

assert.match(
  ledgerSource,
  /import \{ formatRuntimeTechLabel \} from '\.\/techDisplayNames';/,
  'TechLedger should import the shared runtime tag label formatter.',
);

assert.match(
  ledgerSource,
  /scene\.tech\.tools\.map\(\(tool\) => <b key=\{tool\}>\{formatRuntimeTechLabel\(tool\)\}<\/b>\)/,
  'Tool tags should render through the formatter.',
);

assert.match(
  ledgerSource,
  /scene\.tech\.skills\.map\(\(skill\) => <b key=\{skill\}>\{formatRuntimeTechLabel\(skill\)\}<\/b>\)/,
  'Skill tags should render through the formatter.',
);
