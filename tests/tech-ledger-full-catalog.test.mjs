import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));

const ledgerSource = readFileSync(join(root, 'src', 'components', 'TechLedger.tsx'), 'utf8');
const reducerSource = readFileSync(join(root, 'src', 'state', 'vnEventReducer.ts'), 'utf8');
const displaySource = readFileSync(join(root, 'src', 'components', 'techDisplayNames.ts'), 'utf8');
const typesSource = readFileSync(join(root, 'src', 'services', 'types.ts'), 'utf8');
const appSource = readFileSync(join(root, 'src', 'App.tsx'), 'utf8');
const servicePath = join(root, 'src', 'services', 'runtimeTechCatalogApi.ts');

assert.ok(existsSync(servicePath), 'Frontend should fetch the runtime Tool/Skill catalog from the backend.');
const serviceSource = readFileSync(servicePath, 'utf8');

for (const rawName of [
  'search_laws',
  'load_skill',
  'draft_complaint_document',
  'draft_second_instance_judgment_document',
  'search_cases',
  'check_citations',
  'compare_documents',
  'run_case_benchmark_evaluation',
  'read_case_artifact',
  'lawyer-complaint-drafting',
  'lawyer-appeal-response-drafting',
]) {
  assert.match(
    displaySource,
    new RegExp(`['"]${rawName}['"]`),
    `${rawName} should have a frontend fallback display label.`,
  );
}

assert.match(serviceSource, /\/api\/runtime-tech-catalog/, 'Catalog service should call the backend catalog endpoint.');
assert.match(typesSource, /RuntimeTechCatalog/, 'Shared frontend types should define RuntimeTechCatalog.');

assert.match(ledgerSource, /运行工具/, 'TechLedger should render the core runtime tools section.');
assert.match(ledgerSource, /专业技能/, 'TechLedger should render the runtime skills section.');
assert.match(ledgerSource, /扩展能力/, 'TechLedger should render the extension tools section.');
assert.match(ledgerSource, /activeSet\.has\(item\.id\)/, 'TechLedger should detect actively used tools or skills.');
assert.match(ledgerSource, /aria-expanded/, 'Extension tools should be rendered as a collapsible group.');

assert.match(reducerSource, /activeTools/, 'Reducer state should track active tools.');
assert.match(reducerSource, /activeSkills/, 'Reducer state should track active skills.');
assert.match(reducerSource, /lastTechEventAt/, 'Reducer state should track the latest runtime tech event timestamp.');
assert.match(reducerSource, /active_tool_names/, 'Reducer should read active_tool_names from runtime_progress.');
assert.match(reducerSource, /active_skill_names/, 'Reducer should read active_skill_names from runtime_progress.');
assert.match(reducerSource, /clear-runtime-tech-highlight/, 'Reducer should support expiring active highlights.');

assert.match(appSource, /TECH_HIGHLIGHT_DURATION_MS\s*=\s*4000/, 'App should use a 4 second highlight decay.');
assert.match(appSource, /fetchRuntimeTechCatalog/, 'App should load the runtime tech catalog.');
assert.match(appSource, /clear-runtime-tech-highlight/, 'App should dispatch highlight expiry events.');
