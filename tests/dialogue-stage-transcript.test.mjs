import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const appSource = readFileSync(join(root, 'src', 'App.tsx'), 'utf8');
const dialogueSource = readFileSync(join(root, 'src', 'components', 'DialogueBox.tsx'), 'utf8');
const timelineSource = readFileSync(join(root, 'src', 'components', 'CaseTimeline.tsx'), 'utf8');
const vnReducerSource = readFileSync(join(root, 'src', 'state', 'vnEventReducer.ts'), 'utf8');

assert.doesNotMatch(
  dialogueSource,
  /查看全部记录|TRANSCRIPT_STAGES|transcript-stage-actions|activeTranscriptStage/,
  'DialogueBox should not render transcript stage controls; the existing lifecycle timeline owns that UI.',
);

assert.match(
  timelineSource,
  /const TRANSCRIPT_STAGES[\s\S]*code:\s*'PLC'[\s\S]*label:\s*'原告咨询'[\s\S]*code:\s*'CD'[\s\S]*label:\s*'起诉状起草'[\s\S]*code:\s*'DLC'[\s\S]*label:\s*'被告咨询'[\s\S]*code:\s*'DD'[\s\S]*label:\s*'答辩状起草'[\s\S]*code:\s*'CI'[\s\S]*label:\s*'一审庭审'[\s\S]*code:\s*'AD'[\s\S]*label:\s*'上诉状起草'[\s\S]*code:\s*'AR'[\s\S]*label:\s*'上诉答辩状起草'[\s\S]*code:\s*'CIA'[\s\S]*label:\s*'二审庭审'/,
  'CaseTimeline should expose the eight visible case transcript stages in order.',
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
  /TIA:\s*'CI'[\s\S]*TIAA:\s*'CIA'[\s\S]*FINAL_VERDICT:\s*'CIA'/,
  'Court auxiliary stages should be folded into the nearest visible lifecycle stage.',
);

assert.doesNotMatch(
  timelineSource,
  /AR:\s*'AD'/,
  'Appeal response drafting should remain its own visible lifecycle stage.',
);

assert.match(
  timelineSource,
  /function getReceptionTranscriptStage\(entry: DialogueHistoryEntry, currentStage: TranscriptStageCode\): TranscriptStageCode \{[\s\S]*被告[\s\S]*DLC[\s\S]*PLC[\s\S]*\}/,
  'Reception records should be split into plaintiff consultation or defendant consultation instead of one generic consultation bucket.',
);

assert.match(
  timelineSource,
  /let currentStage: TranscriptStageCode = 'PLC';[\s\S]*if \(entry\.stageCode === 'SYSTEM'\) \{\s*groups\[currentStage\]\.push\(entry\);/,
  'SYSTEM entries should follow the latest recognizable lifecycle stage, defaulting to consultation at the start.',
);

assert.match(
  vnReducerSource,
  /PLC:\s*'原告咨询'[\s\S]*DLC:\s*'被告咨询'[\s\S]*AR:\s*'上诉答辩状起草'/,
  'VN reducer should know the eight-stage frontend labels with Chinese explanations.',
);

assert.match(
  vnReducerSource,
  /PLC:\s*'\/art\/vn\/bg-law-office\.png'[\s\S]*DLC:\s*'\/art\/vn\/bg-law-office\.png'/,
  'Plaintiff and defendant consultation stages should keep the law-office visual scene.',
);
