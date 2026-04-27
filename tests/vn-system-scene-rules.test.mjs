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
