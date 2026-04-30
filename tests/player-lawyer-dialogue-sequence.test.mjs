import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const projectRoot = dirname(root);
const appSource = readFileSync(join(root, 'src', 'App.tsx'), 'utf8');
const dialogueSource = readFileSync(join(root, 'src', 'components', 'DialogueBox.tsx'), 'utf8');
const webSocketSource = readFileSync(join(root, 'src', 'services', 'webSocket.ts'), 'utf8');
const vnReducerSource = readFileSync(join(root, 'src', 'state', 'vnEventReducer.ts'), 'utf8');
const agentsSource = readFileSync(join(projectRoot, 'AGENTS.md'), 'utf8');
const rulesSource = readFileSync(join(projectRoot, 'RULES.md'), 'utf8');

assert.match(
  rulesSource,
  /一句一句显示[\s\S]*用户输入[\s\S]*弹窗[\s\S]*不得抢在未确认展示的角色对白前/,
  'Project rules should preserve the hard requirement that story dialogue is shown line by line before user-task modals.',
);

assert.match(
  agentsSource,
  /一句一句显示[\s\S]*用户输入[\s\S]*弹窗[\s\S]*不得抢在未确认展示的角色对白前/,
  'AGENTS.md should repeat the dialogue sequencing rule so future frontend work keeps it visible.',
);

assert.match(
  dialogueSource,
  /onAcknowledgeCurrentEntry\?: \(entry: DialogueHistoryEntry\) => void/,
  'DialogueBox should expose an acknowledgement callback for the current visible dialogue entry.',
);

assert.match(
  dialogueSource,
  /const canAcknowledgeCurrentEntry = currentEntry\?\.id === heldDialogueEntryId;[\s\S]*if \(canAcknowledgeCurrentEntry && currentEntry\) \{\s*onAcknowledgeCurrentEntry\?\.\(currentEntry\);[\s\S]*\}/,
  'Clicking the held story entry should acknowledge the visible line before other UI can advance.',
);

assert.doesNotMatch(
  dialogueSource,
  /dialogue-gate-notice|下一句已准备好|点击“继续”/,
  'DialogueBox should not expose the old next-line-ready gate prompt or a manual continue hint.',
);

assert.match(
  dialogueSource,
  /Agent 正在生成下一句\.\.\./,
  'DialogueBox should show a neutral inline waiting-for-agent-generation notice when the story queue is drained.',
);

assert.doesNotMatch(
  webSocketSource,
  /capabilities:\s*\[[^\]]*'dialogue_turn_gate'/,
  'The player-v2 frontend should not advertise dialogue_turn_gate; ordinary dialogue should stream asynchronously from the backend.',
);

assert.match(
  dialogueSource,
  /heldDialogueEntryId\?: string/,
  'DialogueBox should accept an App-level held dialogue id so fast system events cannot flash over an unacknowledged role line.',
);

assert.match(
  dialogueSource,
  /lastAcknowledgedEntry\?: DialogueHistoryEntry \| null/,
  'DialogueBox should accept the last acknowledged story entry so the queue-drained waiting state does not replace the previous line.',
);

assert.match(
  dialogueSource,
  /const displayEntry = currentEntry \|\| \(!isBlockingNotice\(drainedQueueNotice\) \? lastAcknowledgedEntry : null\);/,
  'DialogueBox should keep showing the last acknowledged line while a non-blocking queue-drained notice is active.',
);

assert.match(
  dialogueSource,
  /const inlineNotice = showTranscript && !currentEntry && drainedQueueNotice && !isBlockingNotice\(drainedQueueNotice\)[\s\S]*\? drainedQueueNotice[\s\S]*: null;/,
  'DialogueBox should render the drained queue notice as a non-blocking inline status when a previous story line is retained.',
);

assert.match(
  dialogueSource,
  /className=\{`dialogue-inline-status \$\{inlineNotice\.tone\}`\}/,
  'DialogueBox should render the waiting-for-agent state as a lightweight status strip instead of replacing dialogue content.',
);

assert.doesNotMatch(
  dialogueSource,
  /if \(entry\.kind === 'dialogue' \|\| entry\.kind === 'error'\)/,
  'DialogueBox should show the latest story history entry, including system progress lines, instead of skipping them until the transcript modal is opened.',
);

assert.match(
  appSource,
  /const \[acknowledgedDialogueEntryId, setAcknowledgedDialogueEntryId\] = useState\(''\);/,
  'App should track whether the latest visible role dialogue has been acknowledged.',
);

assert.match(
  appSource,
  /const nextUnacknowledgedStoryEntry = getNextUnacknowledgedStoryEntry\(vnRuntime\.history, acknowledgedDialogueEntryId\);/,
  'App should derive the earliest unacknowledged story entry from VN history.',
);

assert.match(
  appSource,
  /const playerDialogMayAutoOpen = !nextUnacknowledgedStoryEntry;/,
  'Player task dialogs should auto-open only after every queued story entry has been acknowledged.',
);

assert.match(
  appSource,
  /const latestAcknowledgedStoryEntry = getLatestAcknowledgedStoryEntry\(vnRuntime\.history, acknowledgedDialogueEntryId\);/,
  'App should keep track of the latest story entry the user has actually confirmed.',
);

assert.match(
  appSource,
  /const activePlayerRequestReady = activePlayerRequest[\s\S]*\? isPlayerRequestReadyForDisplay\([\s\S]*activePlayerRequest,[\s\S]*vnRuntime\.history,[\s\S]*latestAcknowledgedStoryEntry,[\s\S]*\)[\s\S]*: false;/,
  'Player requests should not become visible until their triggering dialogue has been shown and acknowledged.',
);

assert.match(
  appSource,
  /const visiblePlayerRequest = activePlayerRequestReady && playerDialogMayAutoOpen \? activePlayerRequest : null;/,
  'The task panel and modal should use a display-ready request instead of the raw pending request or unconfirmed story state.',
);

assert.match(
  appSource,
  /hasPendingUserTask=\{Boolean\(visiblePlayerRequest\)\}/,
  'App should tell DialogueBox when the drained queue is waiting on a visible player task instead of Agent generation.',
);

assert.match(
  appSource,
  /lastAcknowledgedEntry=\{latestAcknowledgedStoryEntry\}/,
  'App should pass the latest acknowledged story entry so the dialogue box can retain it while waiting for the next generated line.',
);

assert.match(
  appSource,
  /const heldDialogueEntryId = nextUnacknowledgedStoryEntry\?\.id \|\| '';/,
  'App should hold the earliest unacknowledged story entry in the main story box so fast stage progress cannot be skipped.',
);

assert.match(
  appSource,
  /function getNextUnacknowledgedStoryEntry\([\s\S]*history: DialogueHistoryEntry\[\],[\s\S]*acknowledgedDialogueEntryId: string,[\s\S]*\): DialogueHistoryEntry \| null \{[\s\S]*for \(let index = startIndex; index < history\.length; index \+= 1\)[\s\S]*entry\.kind === 'dialogue' \|\| isNarrativeSystemEntry\(entry\)[\s\S]*return entry;[\s\S]*return null;[\s\S]*\}/,
  'Queued story entries should advance from oldest to newest, including key system phase progress.',
);

assert.match(
  appSource,
  /function isNarrativeSystemEntry\(entry: DialogueHistoryEntry\): boolean \{[\s\S]*entry\.kind !== 'system'[\s\S]*return !isOperationalContinueNotice\(entry\.text\);[\s\S]*\}/,
  'Operational continue notices should not force extra acknowledgements, but lifecycle system progress should.',
);

assert.match(
  appSource,
  /function isOperationalContinueNotice\(text: string\): boolean \{[\s\S]*已请求继续生成下一句[\s\S]*已收到继续请求[\s\S]*\}/,
  'Operational continue notices should remain centralized so they can be filtered out of the story queue.',
);

assert.match(
  vnReducerSource,
  /function applyRuntimeProgress\(state: VnRuntimeState, payload: Record<string, unknown>\): VnRuntimeState \{[\s\S]*phase === 'memory_checkpoint'[\s\S]*return appendSystemLine\([\s\S]*message[\s\S]*stageCode[\s\S]*\);[\s\S]*\}/,
  'Memory checkpoint progress should be visible as a system story line so stage transitions do not appear silently stuck.',
);

assert.match(
  vnReducerSource,
  /phase === 'memory_checkpoint_complete'[\s\S]*createMemoryCheckpointSummary\(payload\)[\s\S]*applyRuntimeCapabilityDisplay/,
  'Completed memory checkpoint progress should enrich the visible capability ledger with a concrete write-back summary.',
);

assert.match(
  vnReducerSource,
  /function createMemoryCheckpointSummary\(payload: Record<string, unknown>\): string \{[\s\S]*memory_events[\s\S]*changed_fields[\s\S]*未产生字段变更/,
  'The memory checkpoint summary should render changed memory fields and explicitly say when no stable field changed.',
);

assert.match(
  vnReducerSource,
  /function applyRuntimeCapabilityDisplay\([\s\S]*tool_names[\s\S]*skill_names[\s\S]*memory/,
  'Runtime progress metadata should update visible tool, skill, and memory capability fields.',
);

assert.match(
  appSource,
  /if \(!playerDialogMayAutoOpen\) return;[\s\S]*setPlayerDialogOpen\(true\);/,
  'The auto-open effect must be gated by playerDialogMayAutoOpen.',
);

assert.match(
  appSource,
  /function isPlayerRequestReadyForDisplay\([\s\S]*request: NonNullable<ReturnType<typeof usePlayerLawyerRuntime>\['activeRequest'\]>,[\s\S]*history: DialogueHistoryEntry\[\],[\s\S]*latestAcknowledgedStoryEntry: DialogueHistoryEntry \| null,[\s\S]*\): boolean \{[\s\S]*if \(isDocumentStage\(request\.stage\)\) return true;[\s\S]*const requestPrompt = normalizeDialogueText\(request\.prompt\);[\s\S]*return acknowledgedPromptIndex >= 0 && acknowledgedPromptIndex <= latestAcknowledgedIndex;[\s\S]*\}/,
  'Text replies should wait until the request prompt has appeared in the story and the player has acknowledged that line.',
);

assert.match(
  appSource,
  /onAcknowledgeCurrentEntry=\{\(entry\) => \{[\s\S]*setAcknowledgedDialogueEntryId\(entry\.id\);/,
  'DialogueBox acknowledgement should update the App-level latest story acknowledgement state.',
);

assert.match(
  dialogueSource,
  /if \(canAcknowledgeCurrentEntry && currentEntry\) \{\s*onAcknowledgeCurrentEntry\?\.\(currentEntry\);[\s\S]*\}/,
  'Clicking a held story entry should acknowledge that entry first instead of also sending a continue request in the same click.',
);

assert.match(
  appSource,
  /\['ws:player-lawyer-input-submitted', \(payload\) => \{[\s\S]*setDialogueGate\(null\);[\s\S]*dispatchVnEvent\(\{ type: 'player-lawyer-input-submitted', payload \}\);[\s\S]*\}\]/,
  'Submitting a player-lawyer task should clear any stale dialogue gate before the next user click.',
);

assert.match(
  appSource,
  /\['ws:player-lawyer-document-confirmed', \(payload\) => \{[\s\S]*setDialogueGate\(null\);[\s\S]*dispatchVnEvent\(\{ type: 'player-lawyer-document-confirmed', payload \}\);[\s\S]*\}\]/,
  'Confirming a player-lawyer document should clear any stale dialogue gate before the flow advances.',
);

assert.match(
  appSource,
  /\['ws:dialogue-gate-waiting', \(payload\) => \{[\s\S]*void autoContinueDialogueGate\(payload\);[\s\S]*dispatchVnEvent\(\{ type: 'dialogue-gate-waiting', payload \}\);[\s\S]*\}\]/,
  'Legacy dialogue gates should be auto-consumed by the frontend instead of waiting for a visible user continue action.',
);

assert.doesNotMatch(
  dialogueSource,
  /onContinueDialogue|dialogueGate\?|canClickToContinue|等待响应/,
  'DialogueBox should no longer own manual dialogue gate controls.',
);

assert.doesNotMatch(
  vnReducerSource,
  /case 'player-lawyer-input-required':\s*return appendSystemLine\(state, '轮到用户处理当前角色任务：请准备输入回复或处理文书任务。'\);/,
  'Player input requests should not append a system line into the main story history.',
);

assert.doesNotMatch(
  vnReducerSource,
  /case 'player-lawyer-input-submitted':\s*return appendSystemLine/,
  'Submitted player text should return to the story through the real dialogue-update broadcast, not a synthetic system line.',
);

assert.doesNotMatch(
  vnReducerSource,
  /case 'player-lawyer-document-draft-ready':\s*return appendSystemLine/,
  'Document draft readiness should update task state only, not insert a synthetic story line.',
);

assert.doesNotMatch(
  vnReducerSource,
  /case 'player-lawyer-document-confirmed':\s*return appendSystemLine/,
  'Confirmed player documents should return to the story as a lawyer summary dialogue, not a synthetic system line.',
);

assert.match(
  vnReducerSource,
  /case 'player-lawyer-input-submitted':\s*return updateRuntimeStatus/,
  'Submitted player tasks should still update the runtime status without polluting the main story transcript.',
);

assert.match(
  vnReducerSource,
  /DEFENDANT_ARRIVED:\s*'被告已收到法院送达，正在前往律所咨询应对。'/,
  'The defendant arrival event should explain that the defendant is responding to service, not fall back to generic case progress text.',
);

assert.doesNotMatch(
  vnReducerSource,
  /history:\s*\[\.\.\.state\.history,\s*entry\]\.slice\(-40\)/,
  'VN story history should keep the complete current-run transcript instead of truncating to the latest 40 entries.',
);
