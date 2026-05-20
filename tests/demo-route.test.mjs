import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));

function read(relativePath) {
  return readFileSync(join(root, relativePath), 'utf8');
}

const mainSource = read('src/main.tsx');
const demoAppPath = join(root, 'src', 'demo', 'DemoApp.tsx');
const demoRuntimePath = join(root, 'src', 'demo', 'useDemoSimulationRuntime.ts');
const demoCasesPath = join(root, 'src', 'demo', 'demoCases.ts');
const packageSource = read('package.json');

assert.equal(existsSync(demoAppPath), true, 'DemoApp should exist.');
assert.equal(existsSync(demoRuntimePath), true, 'useDemoSimulationRuntime should exist.');
assert.equal(existsSync(demoCasesPath), true, 'demoCases should exist.');

assert.match(
  mainSource,
  /window\.location\.pathname === '\/demo'[\s\S]*DemoApp/,
  'main.tsx should route /demo to DemoApp before the authenticated app.',
);

assert.match(
  mainSource,
  /document\.body\.classList\.toggle\('demo-route'/,
  'main.tsx should add a body class for demo route styling.',
);

const demoCasesSource = read('src/demo/demoCases.ts');
for (const caseId of ['case_1', 'case_3', 'case_5', 'case_6', 'case_7', 'case_9']) {
  assert.match(demoCasesSource, new RegExp(`caseId:\\s*'${caseId}'`), `${caseId} should be available in demo cases.`);
}

for (const stage of ['PLC', 'CD', 'DLC', 'DD', 'CI', 'AD', 'AR', 'CIA']) {
  assert.match(demoCasesSource, new RegExp(`['"]${stage}['"]`), `${stage} should appear in the offline full-flow demo.`);
}

assert.equal(
  (demoCasesSource.match(/caseId:\s*'case_/g) || []).length,
  6,
  'The offline demo should expose exactly six selectable case blueprints.',
);

assert.match(
  demoCasesSource,
  /kind:\s*'reply'[\s\S]*kind:\s*'document'[\s\S]*kind:\s*'court'[\s\S]*kind:\s*'document'/,
  'The shared full-flow stage builder should include reply, document, court, and appeal-document tasks for every case.',
);

assert.ok(
  (demoCasesSource.match(/documentItem\(item\.caseId/g) || []).length >= 5,
  'Each demo case should expose multiple pre-generated document entries.',
);

assert.match(
  demoCasesSource,
  /buildEvaluation[\s\S]*improvements[\s\S]*overallScore[\s\S]*strengths/,
  'Demo cases should include pre-generated closing evaluations.',
);

assert.match(
  read('src/demo/useDemoSimulationRuntime.ts'),
  /buildRequest[\s\S]*PlayerLawyerRequest/,
  'Demo runtime should adapt offline tasks to PlayerLawyerRequest shape.',
);

assert.match(
  read('src/demo/useDemoSimulationRuntime.ts'),
  /buildScene[\s\S]*DialogueScene/,
  'Demo runtime should adapt offline stages to DialogueScene shape.',
);

assert.match(
  read('src/demo/DemoApp.tsx'),
  /CasePicker[\s\S]*PlayerLawyerInputDialog[\s\S]*CaseClosingSummaryDialog/s,
  'DemoApp should reuse the existing case picker, player task dialog, and closing summary dialog.',
);

assert.match(
  packageSource,
  /"test:demo":\s*"node tests\/demo-route\.test\.mjs"/,
  'frontend-v2 should expose a focused demo route test.',
);
