import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const appSource = readFileSync(join(root, 'src', 'App.tsx'), 'utf8');
const dialogueSource = readFileSync(join(root, 'src', 'components', 'DialogueBox.tsx'), 'utf8');
const timelineSource = readFileSync(join(root, 'src', 'components', 'CaseTimeline.tsx'), 'utf8');

assert.doesNotMatch(
  dialogueSource,
  /查看全部记录|TRANSCRIPT_STAGES|transcript-stage-actions|activeTranscriptStage/,
  'DialogueBox should not render transcript stage controls; the existing lifecycle timeline owns that UI.',
);

assert.match(
  timelineSource,
  /const TRANSCRIPT_STAGES[\s\S]*code:\s*'LC'[\s\S]*label:\s*'咨询'[\s\S]*code:\s*'CD'[\s\S]*label:\s*'起诉状'[\s\S]*code:\s*'DD'[\s\S]*label:\s*'答辩状'[\s\S]*code:\s*'CI'[\s\S]*label:\s*'一审'[\s\S]*code:\s*'AD'[\s\S]*label:\s*'上诉'[\s\S]*code:\s*'CIA'[\s\S]*label:\s*'二审'/,
  'CaseTimeline should expose the six visible case transcript stages in order.',
);

assert.match(
  appSource,
  /<CaseTimeline[\s\S]*activeCode=\{displayedScene\.stageCode\}[\s\S]*backendMode=\{auth\.backendConfigured && Boolean\(auth\.user\)\}[\s\S]*history=\{vnRuntime\.history\}/,
  'App should pass current VN history into the existing bottom lifecycle timeline.',
);

assert.match(
  timelineSource,
  /setActiveTranscriptStage\(stage\.code\)/,
  'Clicking a bottom lifecycle stage should open that stage transcript.',
);

assert.match(
  timelineSource,
  /disabled=\{entries\.length === 0\}/,
  'Empty lifecycle stage controls should remain visible but disabled.',
);

assert.match(
  timelineSource,
  /\{activeStage\.label\}对话记录/,
  'The transcript modal title should name the selected stage instead of showing a global all-records title.',
);

assert.match(
  timelineSource,
  /RECEPTION:\s*'LC'[\s\S]*TIA:\s*'CI'[\s\S]*AR:\s*'AD'[\s\S]*TIAA:\s*'CIA'[\s\S]*FINAL_VERDICT:\s*'CIA'/,
  'Auxiliary stages should be folded into the nearest visible lifecycle stage.',
);

assert.match(
  timelineSource,
  /if \(entry\.stageCode === 'SYSTEM'\) \{\s*groups\[currentStage\]\.push\(entry\);/,
  'SYSTEM entries should follow the latest recognizable lifecycle stage, defaulting to consultation at the start.',
);
