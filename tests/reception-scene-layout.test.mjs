import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const reducerSource = readFileSync(join(root, 'src', 'state', 'vnEventReducer.ts'), 'utf8');
const stageSource = readFileSync(join(root, 'src', 'components', 'VisualNovelStage.tsx'), 'utf8');
const webSocketSource = readFileSync(join(root, 'src', 'services', 'webSocket.ts'), 'utf8');
const dialogueSource = readFileSync(join(root, 'src', 'components', 'DialogueBox.tsx'), 'utf8');
const appSource = readFileSync(join(root, 'src', 'App.tsx'), 'utf8');

assert.match(
  reducerSource,
  /RECEPTION:\s*'\/art\/vn\/bg-reception-desk\.png'/,
  'The RECEPTION stage should use the dedicated front desk background.',
);

assert.match(
  reducerSource,
  /const stageCode = !explicitStageCode && isReceptionPayload\(payload, text\)\s*\?\s*'RECEPTION'/,
  'Front desk dialogue should be classified as RECEPTION before falling back to the payload stage.',
);

assert.match(
  reducerSource,
  /const explicitStageCode = normalizeExplicitDialogueStageCode\(payload\.scenario_type \|\| payload\.stage\);[\s\S]*const stageCode = !explicitStageCode && isReceptionPayload\(payload, text\)[\s\S]*\? 'RECEPTION'/,
  'Reception inference should not override explicit LC/PLC/DLC dialogue stages.',
);

assert.match(
  reducerSource,
  /speaker\.includes\('前台'\)[\s\S]*speaker\.includes\('接待'\)[\s\S]*isReceptionDialogueText\(text\)/,
  'Reception detection should include front desk speaker names, not only recommendation text.',
);

assert.match(
  reducerSource,
  /function isBackgroundDialogue\(stageCode: string, text: string\): boolean \{[\s\S]*return false;[\s\S]*\}/,
  'Front desk recommendation text should stay in the main dialogue flow instead of being hidden in the background rail.',
);

assert.match(
  reducerSource,
  /value\.includes\('client'\)[\s\S]*value\.includes\('plaintiff'\)[\s\S]*value\.includes\('case_'\)[\s\S]*return caseArt\.plaintiffKey;[\s\S]*if \(stageCode === 'RECEPTION'/,
  'Reception client lines should render as the client, not as the receptionist.',
);

assert.match(
  webSocketSource,
  /type === 'agent_update_dialogue'[\s\S]*isReceptionAgentDialogue\(payload\)[\s\S]*'ws:map-event'[\s\S]*'ws:dialogue-update'/,
  'Front desk agent dialogue updates should feed both radar location state and the VN dialogue stream.',
);

assert.match(
  webSocketSource,
  /content:\s*payload\.content\s*\|\|\s*payload\.dialogue_text/,
  'Map-style dialogue payloads should be normalized to the dialogue_update content field.',
);

assert.match(
  webSocketSource,
  /function isReceptionAgentDialogue[\s\S]*agentId\.includes\('reception'\)[\s\S]*推荐律师[\s\S]*分配给/,
  'Only reception-related map dialogue should bypass map handling; LC dialogue gates must stay intact.',
);

assert.match(
  dialogueSource,
  /function getVisibleCurrentEntry\(history: DialogueHistoryEntry\[\], heldDialogueEntryId = ''\): DialogueHistoryEntry \| null \{[\s\S]*if \(!heldDialogueEntryId\) return null;[\s\S]*return history\.find\(\(entry\) => entry\.id === heldDialogueEntryId\) \|\| null;[\s\S]*\}/,
  'The main dialogue box should keep an unacknowledged reception character line visible, then show latest system progress after acknowledgement.',
);

assert.match(
  reducerSource,
  /export function createSceneForHistoryEntry\(scene: DialogueScene, entry: DialogueHistoryEntry\): DialogueScene \{[\s\S]*speaker: entry\.speaker[\s\S]*stageCode: entry\.stageCode[\s\S]*text: entry\.text/,
  'Held dialogue entries should be able to restore the matching stage, speaker, and text for the VN stage.',
);

assert.match(
  appSource,
  /const displayedScene = nextUnacknowledgedStoryEntry[\s\S]*createSceneForHistoryEntry\(scene, nextUnacknowledgedStoryEntry\)[\s\S]*<VisualNovelStage scene=\{displayedScene\} \/>/,
  'When a reception dialogue is held visible, the stage art should use that dialogue scene instead of the latest system scene.',
);

assert.match(
  reducerSource,
  /function inferCharacters\(stageCode: string, speaker: CharacterKey\): CharacterKey\[\] \{\s*return \[speaker\];\s*\}/,
  'The RECEPTION stage should follow the global single-speaker portrait rule.',
);

assert.match(
  stageSource,
  /getSceneCharacterPosition\(scene\.stageCode,\s*key,\s*character\.position\)/,
  'Character placement should support stage-specific overrides.',
);

assert.match(
  stageSource,
  /if \(stageCode === 'RECEPTION'\) \{[\s\S]*if \(key === 'client'\) return 'left';[\s\S]*if \(key === 'receptionist'\) return 'right';/,
  'The RECEPTION stage should place the client on the left and receptionist on the right.',
);
