import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import assert from 'node:assert/strict';

const root = new URL('..', import.meta.url).pathname;
const casePicker = readFileSync(join(root, 'src', 'components', 'CasePicker.tsx'), 'utf8');
const app = readFileSync(join(root, 'src', 'App.tsx'), 'utf8');
const packageJson = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));

assert.match(casePicker, /onOpenHumanEval:\s*\(\)\s*=>\s*void/, 'CasePicker should accept an onOpenHumanEval callback.');
assert.match(casePicker, />\s*人工评测\s*</, 'CasePicker should render a visible 人工评测 button.');
assert.match(casePicker, /onClick=\{onOpenHumanEval\}/, 'Human eval button should call onOpenHumanEval directly.');
assert.match(app, /onOpenHumanEval=\{\(\)\s*=>\s*\{\s*window\.location\.assign\('\/human-eval'\);?\s*\}\}/s, 'App should navigate to /human-eval from CasePicker.');
assert.equal(packageJson.scripts['test:human-eval'], 'node tests/human-eval-entry.test.mjs && node tests/human-eval-contract.test.mjs');
