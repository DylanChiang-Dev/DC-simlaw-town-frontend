import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const reducerSource = readFileSync(join(root, 'src', 'state', 'vnEventReducer.ts'), 'utf8');
const stageSource = readFileSync(join(root, 'src', 'components', 'VisualNovelStage.tsx'), 'utf8');

assert.match(
  reducerSource,
  /RECEPTION:\s*'\/art\/vn\/bg-reception-desk\.png'/,
  'The RECEPTION stage should use the dedicated front desk background.',
);

assert.match(
  reducerSource,
  /const stageCode = isReceptionPayload\(payload, text\)\s*\?\s*'RECEPTION'/,
  'Front desk dialogue should be classified as RECEPTION before falling back to the payload stage.',
);

assert.match(
  reducerSource,
  /speaker\.includes\('前台'\)[\s\S]*speaker\.includes\('接待'\)[\s\S]*isReceptionDialogueText\(text\)/,
  'Reception detection should include front desk speaker names, not only recommendation text.',
);

assert.match(
  reducerSource,
  /function isBackgroundDialogue\(stageCode: string, text: string\): boolean \{[\s\S]*return isReceptionRecommendationText\(text\);[\s\S]*\}/,
  'Only lawyer recommendation text should move to background consultation; normal front desk dialogue should stay in the main dialogue box.',
);

assert.match(
  reducerSource,
  /RECEPTION:\s*\['receptionist',\s*'client'\]/,
  'The RECEPTION stage should only show the receptionist and client.',
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
