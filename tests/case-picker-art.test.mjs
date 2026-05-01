import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const casePickerSource = readFileSync(join(root, 'src', 'components', 'CasePicker.tsx'), 'utf8');
const styleSource = readFileSync(join(root, 'src', 'styles.css'), 'utf8');

assert.match(
  casePickerSource,
  /import \{ getCaseArtProfile \} from '\.\.\/data\/caseArt';/,
  'CasePicker should use the shared case art profile map.',
);

assert.match(
  casePickerSource,
  /const art = getCaseArtProfile\(item\.caseId\);/,
  'Each case card should resolve its own art profile.',
);

assert.match(
  casePickerSource,
  /<img[\s\S]*className="case-card-preview"[\s\S]*src=\{art\.caseCg\}[\s\S]*alt=\{`\$\{item\.title\}案件预览`\}/,
  'Case cards should render the case-specific CG preview image with an accessible alt.',
);

assert.match(
  styleSource,
  /\.case-card-preview\s*\{[\s\S]*aspect-ratio:\s*16\s*\/\s*9[\s\S]*object-fit:\s*cover/,
  'Case card preview images should keep a stable 16:9 frame.',
);

assert.match(
  styleSource,
  /@media \(max-width: 720px\)[\s\S]*\.case-card-preview\s*\{[\s\S]*max-height:/,
  'Mobile case card previews should be height constrained so they do not squeeze text.',
);
