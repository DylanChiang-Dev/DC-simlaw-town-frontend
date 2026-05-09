import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import assert from 'node:assert/strict';

const root = new URL('..', import.meta.url).pathname;
const main = readFileSync(join(root, 'src', 'main.tsx'), 'utf8');
const app = readFileSync(join(root, 'src', 'humanEval', 'HumanEvalApp.tsx'), 'utf8');
const scorePanel = readFileSync(join(root, 'src', 'humanEval', 'HumanEvalScorePanel.tsx'), 'utf8');
const reader = readFileSync(join(root, 'src', 'humanEval', 'HumanEvalCaseReader.tsx'), 'utf8');
const styles = readFileSync(join(root, 'src', 'styles.css'), 'utf8');

assert.match(main, /window\.location\.pathname\s*===\s*'\/human-eval'/, 'main.tsx should route /human-eval to HumanEvalApp.');
assert.match(app, /fetchHumanEvalCases/, 'HumanEvalApp should fetch case list.');
assert.match(app, /fetchHumanEvalSchema/, 'HumanEvalApp should fetch schema.');
assert.match(app, /fetchHumanEvalCase/, 'HumanEvalApp should fetch selected case material.');
assert.match(app, /saveHumanEvalRating/, 'HumanEvalApp should save ratings.');
assert.match(reader, /SD[\s\S]*只展示不评分|只展示不评分[\s\S]*SD/, 'Reader should label SD as display-only.');
assert.match(scorePanel, /procedural_compliance/, 'Score panel should render procedural_compliance.');
assert.match(scorePanel, /process_coherence/, 'Score panel should render process_coherence.');
assert.match(scorePanel, /client_stance_authenticity/, 'Score panel should include role consistency metrics.');
assert.match(scorePanel, /score < 0 \|\| score > 10/, 'Score panel should validate 0-10 scores.');
assert.match(scorePanel, /reason\.trim\(\)/, 'Score panel should require non-empty reasons.');
assert.match(styles, /\.human-eval-workbench/, 'styles should define human eval workbench layout.');
