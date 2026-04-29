import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const runtimeSceneSource = readFileSync(join(root, 'src', 'data', 'runtimeScene.ts'), 'utf8');
const reducerSource = readFileSync(join(root, 'src', 'state', 'vnEventReducer.ts'), 'utf8');
const stageSource = readFileSync(join(root, 'src', 'components', 'VisualNovelStage.tsx'), 'utf8');
const styleSource = readFileSync(join(root, 'src', 'styles.css'), 'utf8');

[
  'char-defendant-cheng-yujing-defensive.png',
  'char-appeal-judge-neutral.png',
  'char-court-clerk-neutral.png',
  'char-judge-assistant-checking.png',
  'char-traffic-officer-neutral.png',
].forEach((asset) => {
  assert.match(
    runtimeSceneSource,
    new RegExp(asset.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
    `${asset} should be embedded in the runtime character map.`,
  );
});

assert.match(
  reducerSource,
  /value\.includes\('defendant'\)[\s\S]*return 'defendant';/,
  'Defendant speaker payloads should use Cheng Yujing, not the defendant lawyer portrait.',
);

assert.match(
  reducerSource,
  /value\.includes\('appeal'\)[\s\S]*return 'appealJudge';/,
  'Appeal judge payloads should use the generated second-instance judge portrait.',
);

assert.match(
  reducerSource,
  /function inferCharacters\(stageCode: string, speaker: CharacterKey\): CharacterKey\[\] \{\s*return \[speaker\];\s*\}/,
  'Dialogue scenes should expose only the current speaker as the visible character.',
);

assert.match(
  stageSource,
  /const visibleCharacters = getVisibleCharacters\(scene\);/,
  'VisualNovelStage should derive a defensive single-speaker render list.',
);

assert.match(
  stageSource,
  /function getVisibleCharacters\(scene: DialogueScene\)[\s\S]*return \[scene\.speaker\];/,
  'The visual layer should render only the active speaker even if scene.characters contains extra roles.',
);

assert.match(
  styleSource,
  /height:\s*var\(--vn-character-height\);[\s\S]*width:\s*auto;/,
  'Character portraits should be normalized by height, not by canvas width.',
);

assert.doesNotMatch(
  styleSource,
  /portrait-layer\.count-[23]\s+\.character-portrait/,
  'Multi-character count rules should not resize portraits differently.',
);
