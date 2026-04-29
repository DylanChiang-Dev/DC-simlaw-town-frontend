import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const runtimeSceneSource = readFileSync(join(root, 'src', 'data', 'runtimeScene.ts'), 'utf8');
const reducerSource = readFileSync(join(root, 'src', 'state', 'vnEventReducer.ts'), 'utf8');
const stageSource = readFileSync(join(root, 'src', 'components', 'VisualNovelStage.tsx'), 'utf8');
const dialogueSource = readFileSync(join(root, 'src', 'components', 'DialogueBox.tsx'), 'utf8');

assert.match(
  runtimeSceneSource,
  /\|\s*'system'/,
  'Runtime scene data should have a dedicated system speaker instead of borrowing a lawyer character.',
);

assert.match(
  runtimeSceneSource,
  /system:\s*\{[\s\S]*name:\s*'系统'[\s\S]*role:\s*'流程运行与状态提示'/,
  'The system speaker should have its own display name and role.',
);

assert.match(
  reducerSource,
  /SYSTEM:\s*'系统运行'/,
  'The reducer should define a dedicated SYSTEM stage label.',
);

assert.match(
  reducerSource,
  /SYSTEM:\s*'\/art\/vn\/bg-case-analysis-room\.png'/,
  'System waiting and running states should use a neutral system background scene.',
);

assert.match(
  reducerSource,
  /CD:\s*'\/art\/vn\/bg-document-desk\.png'[\s\S]*DD:\s*'\/art\/vn\/bg-document-desk\.png'[\s\S]*AD:\s*'\/art\/vn\/bg-document-desk\.png'[\s\S]*AR:\s*'\/art\/vn\/bg-document-desk\.png'/,
  'Document drafting stages should use the generated document desk background.',
);

assert.match(
  reducerSource,
  /PLC:\s*'\/art\/vn\/bg-law-office\.png'[\s\S]*CD:\s*'\/art\/vn\/bg-document-desk\.png'[\s\S]*DLC:\s*'\/art\/vn\/bg-law-office\.png'[\s\S]*DD:\s*'\/art\/vn\/bg-document-desk\.png'[\s\S]*CI:\s*'\/art\/vn\/bg-courtroom\.png'[\s\S]*AD:\s*'\/art\/vn\/bg-document-desk\.png'[\s\S]*AR:\s*'\/art\/vn\/bg-document-desk\.png'[\s\S]*CIA:\s*'\/art\/vn\/bg-appeal-courtroom\.png'/,
  'The eight visible lifecycle stages should each have the intended VN background mapping.',
);

assert.match(
  runtimeSceneSource,
  /code:\s*'PLC'[\s\S]*code:\s*'CD'[\s\S]*code:\s*'DLC'[\s\S]*code:\s*'DD'[\s\S]*code:\s*'CI'[\s\S]*code:\s*'AD'[\s\S]*code:\s*'AR'[\s\S]*code:\s*'CIA'/,
  'The lifecycle rail should keep the eight visible stages in process order.',
);

assert.match(
  reducerSource,
  /CIA:\s*'\/art\/vn\/bg-appeal-courtroom\.png'[\s\S]*FINAL_VERDICT:\s*'\/art\/vn\/bg-appeal-courtroom\.png'/,
  'Second-instance hearing and final verdict stages should use the generated appeal courtroom background.',
);

assert.match(
  reducerSource,
  /const SYSTEM_SCENE: DialogueScene = \{[\s\S]*stageCode:\s*'SYSTEM'[\s\S]*speaker:\s*'system'[\s\S]*characters:\s*\[\]/,
  'The default backend idle scene should show no character portrait.',
);

assert.match(
  reducerSource,
  /function createSystemScene\(scene: DialogueScene, text: string\): DialogueScene \{[\s\S]*characters:\s*\[\][\s\S]*speaker:\s*'system'/,
  'System lines should switch the main scene to a no-character system scene.',
);

assert.match(
  reducerSource,
  /function applyScenarioStart[\s\S]*const scene = createSystemScene\(state\.scene, text\);/,
  'Scenario-start waiting states should not pre-display the next role portrait.',
);

assert.match(
  stageSource,
  /if \(scene\.speaker === 'system'\) return \[\];/,
  'The visual stage should render no character for system scenes.',
);

assert.match(
  dialogueSource,
  /const speaker = characters\[scene\.speaker\];/,
  'DialogueBox should be able to resolve the dedicated system speaker metadata.',
);
