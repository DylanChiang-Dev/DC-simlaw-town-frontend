import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const appSource = readFileSync(join(root, 'src', 'App.tsx'), 'utf8');
const dialogueSource = readFileSync(join(root, 'src', 'components', 'DialogueBox.tsx'), 'utf8');
const simulationRuntimeSource = readFileSync(join(root, 'src', 'state', 'useSimulationRuntime.ts'), 'utf8');
const runtimeSource = readFileSync(join(root, 'src', 'state', 'usePlayerLawyerRuntime.ts'), 'utf8');
const vnReducerSource = readFileSync(join(root, 'src', 'state', 'vnEventReducer.ts'), 'utf8');

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
  runtimeSource,
  /PLAYER_MODE_NEGOTIATING_MESSAGE = 'Player-lawyer mode is not enabled'/,
  'The backend mode negotiation message should be recognized as a transient refresh condition.',
);

assert.match(
  runtimeSource,
  /catch \(err\) \{[\s\S]*setActiveRequest\(null\)[\s\S]*isPlayerLawyerModeNegotiatingError\(err\)[\s\S]*setError\(''\)/,
  'Transient player-lawyer mode negotiation errors during page refresh should not show the user task panel.',
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

assert.match(
  appSource,
  /if \(!runtime\.activeCaseId\) \{[\s\S]*setDialogueGate\(null\)[\s\S]*setPlayerDialogOpen\(false\)[\s\S]*\}/,
  'Resetting to no active case should clear stale dialogue gates and player dialogs.',
);

assert.match(
  appSource,
  /\['ws:dialogue-gate-error', \(payload\) => \{[\s\S]*setDialogueGate\(null\)[\s\S]*dispatchVnEvent\(\{ type: 'dialogue-gate-error', payload \}\)/,
  'A backend dialogue gate not-found error should remove the stale continue gate from the UI.',
);

assert.match(
  appSource,
  /\['ws:scenario-start', \(payload\) => \{[\s\S]*setDialogueGate\(null\)[\s\S]*dispatchVnEvent\(\{ type: 'scenario-start', payload \}\)/,
  'Starting a new scenario should clear any dialogue gate from the previous run.',
);

assert.match(
  appSource,
  /async function handleStartSelectedCase\(caseId\?: string\): Promise<void> \{[\s\S]*setDialogueGate\(null\)[\s\S]*await runtime\.startSelectedCase\(caseId\)/,
  'Starting a selected case should clear stale dialogue gates before entering the new run.',
);

assert.doesNotMatch(
  appSource,
  /onResumeCurrentCase=\{runtime\.activeCaseId \? runtime\.startSelectedCase : undefined\}/,
  'Resume actions should use the stale-gate clearing start handler, not call runtime.startSelectedCase directly.',
);

assert.match(
  appSource,
  /async function handleRestartSimulation\(\): Promise<void> \{[\s\S]*setDialogueGate\(null\)[\s\S]*await runtime\.restart\(\)/,
  'Restarting the simulation should clear stale dialogue gates immediately.',
);

assert.doesNotMatch(
  dialogueSource,
  /player-turn-preview|当前用户任务要求|轮到用户处理当前角色任务|等待用户处理|onOpenPlayerInput|pendingRequest \?/,
  'Pending user tasks should not be rendered as persistent main dialogue content.',
);

const disconnectedCase = vnReducerSource.match(/case 'ws-disconnected':([\s\S]*?)case 'dialogue-update':/)?.[1] || '';
assert.match(
  disconnectedCase,
  /updateRuntimeStatus[\s\S]*phase: 'disconnected'[\s\S]*系统正在自动重连/,
  'A WebSocket close during reset should still update runtime status as reconnecting.',
);
assert.doesNotMatch(
  disconnectedCase,
  /appendErrorLine|lastError:\s*'实时连接已断开'/,
  'A normal WebSocket close during reset should not become the current dialogue error.',
);
