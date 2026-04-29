import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const appSource = readFileSync(join(root, 'src', 'App.tsx'), 'utf8');
const dialogueSource = readFileSync(join(root, 'src', 'components', 'DialogueBox.tsx'), 'utf8');
const timelineSource = readFileSync(join(root, 'src', 'components', 'CaseTimeline.tsx'), 'utf8');
const vnReducerSource = readFileSync(join(root, 'src', 'state', 'vnEventReducer.ts'), 'utf8');
const stylesSource = readFileSync(join(root, 'src', 'styles.css'), 'utf8');

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
  timelineSource,
  /const TRANSCRIPT_STAGES[\s\S]*order:\s*1[\s\S]*code:\s*'PLC'[\s\S]*order:\s*2[\s\S]*code:\s*'CD'[\s\S]*order:\s*8[\s\S]*code:\s*'CIA'/,
  'Each visible lifecycle stage should have a stable 01-08 order number for user-facing references.',
);

assert.match(
  timelineSource,
  /formatStageOrder\(stage\.order\)[\s\S]*<strong>\{stage\.code\}<\/strong>/,
  'The bottom lifecycle controls should show the 01-08 stage number next to the stage code.',
);

assert.match(
  timelineSource,
  /annotateTranscriptEntries\(activeStageEntries, activeStage\)[\s\S]*formatTranscriptMarker\(item\.meta\)/,
  'The stage transcript modal should render a marker for every entry with stage order and dialogue turn.',
);

assert.match(
  timelineSource,
  /if \(isOperationalTranscriptNotice\(entry\)\) \{\s*continue;\s*\}[\s\S]*function isOperationalTranscriptNotice\(entry: DialogueHistoryEntry\): boolean \{[\s\S]*entry\.kind !== 'system'[\s\S]*已请求继续生成下一句[\s\S]*已收到继续请求/,
  'Operational continue notices should be excluded from stage transcripts and lifecycle stage counts.',
);

assert.match(
  timelineSource,
  /className=\{`dialogue-history-entry stage-transcript-entry \$\{item\.entry\.kind\}`\}/,
  'The stage transcript modal should use a dedicated entry class instead of relying on the two-column dialogue history layout.',
);

assert.match(
  stylesSource,
  /\.dialogue-records-list \.stage-transcript-entry\s*\{[\s\S]*grid-template-columns:\s*minmax\(132px,\s*max-content\)\s+max-content\s+minmax\(0,\s*1fr\)[\s\S]*\}[\s\S]*\.dialogue-records-list \.stage-transcript-entry \.markdown-text\s*\{[\s\S]*grid-column:\s*3[\s\S]*min-width:\s*0/,
  'Transcript modal entries should reserve separate columns for the marker, speaker, and full-width body text.',
);

assert.match(
  timelineSource,
  /function getEntryTurnNumber\(entry: DialogueHistoryEntry, fallbackIndex: number\): number \{[\s\S]*typeof entry\.turn === 'number'[\s\S]*return entry\.turn \+ 1[\s\S]*return fallbackIndex \+ 1;[\s\S]*\}/,
  'Transcript markers should reuse backend turn numbers as one-based labels and fall back to stage-local order when turn is missing.',
);

assert.match(
  vnReducerSource,
  /turn\?: number;/,
  'Dialogue history entries should preserve backend dialogue turn numbers when available.',
);

assert.match(
  vnReducerSource,
  /return appendHistory\(\{ \.\.\.state, scene \}, scene, 'dialogue', readDialogueTurn\(payload\.turn\)\);/,
  'VN reducer should store the dialogue turn on history entries.',
);

assert.match(
  stylesSource,
  /\.case-timeline\s*\{[\s\S]*grid-template-columns:\s*repeat\(8,\s*minmax\(0,\s*1fr\)\)/,
  'The eight lifecycle stages should fit into one compact desktop row.',
);

assert.match(
  stylesSource,
  /\.transcript-entry-marker[\s\S]*font-variant-numeric:\s*tabular-nums/,
  'Transcript turn markers should use stable numeric alignment.',
);

assert.doesNotMatch(
  stylesSource,
  /\.case-timeline\s*\{[\s\S]*grid-template-columns:\s*repeat\(2,\s*1fr\)/,
  'Responsive timeline styles should not collapse the lifecycle rail into two rows.',
);

assert.match(
  appSource,
  /<CaseTimeline[\s\S]*activeCode=\{displayedScene\.stageCode\}[\s\S]*activeEntry=\{nextUnacknowledgedStoryEntry\}[\s\S]*backendMode=\{auth\.backendConfigured && Boolean\(auth\.user\)\}[\s\S]*history=\{vnRuntime\.history\}/,
  'App should pass the displayed story entry and current VN history into the existing bottom lifecycle timeline.',
);

assert.match(
  timelineSource,
  /const activeLifecycleCode = resolveActiveLifecycleCode\(activeCode, timelineHistory, activeEntry\);[\s\S]*function resolveActiveLifecycleCode\(\s*activeCode: string,\s*history: DialogueHistoryEntry\[\],\s*activeEntry\?: DialogueHistoryEntry \| null,\s*\): TranscriptStageCode \| string \{[\s\S]*if \(normalized === 'RECEPTION'\)[\s\S]*const receptionEntry = activeEntry\?\.stageCode === 'RECEPTION'\s*\? activeEntry\s*:\s*findLatestReceptionEntry\(history\);[\s\S]*getReceptionTranscriptStage\(receptionEntry, latestKnownStage\)/,
  'The active lifecycle highlight should classify RECEPTION by the current reception record/history, so defendant reception highlights DLC instead of PLC.',
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
