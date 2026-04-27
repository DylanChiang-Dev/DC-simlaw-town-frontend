import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const appSource = readFileSync(join(root, 'src', 'App.tsx'), 'utf8');
const dialogueSource = readFileSync(join(root, 'src', 'components', 'DialogueBox.tsx'), 'utf8');
const simulationRuntimeSource = readFileSync(join(root, 'src', 'state', 'useSimulationRuntime.ts'), 'utf8');
const runtimeSource = readFileSync(join(root, 'src', 'state', 'usePlayerLawyerRuntime.ts'), 'utf8');

assert.match(
  appSource,
  /usePlayerLawyerRuntime\(\s*auth\.backendConfigured && Boolean\(auth\.user\) && Boolean\(runtime\.activeCaseId\),\s*runtime\.activeCaseId,\s*\)/,
  'Player-lawyer requests should only be polled while a real active case is running or paused.',
);

assert.doesNotMatch(
  appSource,
  /usePlayerLawyerRuntime\(\s*auth\.backendConfigured && Boolean\(auth\.user\),\s*runtime\.selectedCaseId,\s*\)/,
  'Player-lawyer pending requests must not be fetched from the selected case after reset.',
);

assert.match(
  runtimeSource,
  /catch \(err\) \{[\s\S]*setActiveRequest\(null\)[\s\S]*setError/,
  'A failed player-lawyer refresh should clear stale activeRequest so reset cannot leave old tasks on screen.',
);

assert.match(
  simulationRuntimeSource,
  /const status = simulation\?\.status[\s\S]*if \(!simulation\?\.simulationRunning && status !== 'running' && status !== 'paused'\) return '';/,
  'selectedCaseId should not count as active after reset when sandbox status is idle.',
);

assert.match(
  appSource,
  /const activePlayerRequest = playerLawyer\.activeRequest[\s\S]*runtime\.activeCaseId[\s\S]*playerLawyer\.activeRequest\.caseId === runtime\.activeCaseId[\s\S]*\? playerLawyer\.activeRequest[\s\S]*: null;/,
  'Recovered player-lawyer tasks should only display when they belong to the current active case.',
);

assert.doesNotMatch(
  appSource,
  /\{playerLawyer\.activeRequest && !playerDialogOpen &&/,
  'The recovery banner must not render directly from stale activeRequest after reset.',
);

assert.doesNotMatch(
  dialogueSource,
  /player-turn-preview|当前用户任务要求|轮到用户处理当前角色任务|等待用户处理|onOpenPlayerInput|pendingRequest \?/,
  'Pending user tasks should not be rendered as persistent main dialogue content.',
);
