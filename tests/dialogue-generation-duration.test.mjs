import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const dialogueSource = readFileSync(join(root, 'src', 'components', 'DialogueBox.tsx'), 'utf8');
const vnReducerSource = readFileSync(join(root, 'src', 'state', 'vnEventReducer.ts'), 'utf8');
const stylesSource = readFileSync(join(root, 'src', 'styles.css'), 'utf8');

assert.match(
  vnReducerSource,
  /generationDurationSeconds\?: number;/,
  'Dialogue history entries should preserve optional backend generation duration.',
);

assert.match(
  vnReducerSource,
  /readGenerationDurationSeconds\(payload\.generation_duration_seconds\)/,
  'VN reducer should read generation_duration_seconds from dialogue_update payloads.',
);

assert.match(
  dialogueSource,
  /function formatGenerationDuration\(seconds: number\): string \{[\s\S]*Math\.floor\(safeSeconds \/ 60\)[\s\S]*padStart\(2, '0'\)[\s\S]*return `耗时 \$\{minutes\}分\$\{remainingSeconds\}秒`;/,
  'DialogueBox should format 120.9884 seconds as 耗时 2分01秒.',
);

assert.match(
  dialogueSource,
  /displayEntry\?\.generationDurationSeconds[\s\S]*<span className="dialogue-generation-duration">[\s\S]*formatGenerationDuration\(displayEntry\.generationDurationSeconds\)/,
  'DialogueBox should render generation duration metadata only for entries with a valid duration.',
);

assert.match(
  stylesSource,
  /\.dialogue-generation-duration\s*\{[\s\S]*font-variant-numeric:\s*tabular-nums[\s\S]*font-size:\s*12px/,
  'Generation duration metadata should use quiet small text with stable numeric alignment.',
);
