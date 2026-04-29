import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const projectRoot = dirname(root);
const appSource = readFileSync(join(root, 'src', 'App.tsx'), 'utf8');
const dialogueSource = readFileSync(join(root, 'src', 'components', 'DialogueBox.tsx'), 'utf8');
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
  /if \(currentEntry\?\.id === heldDialogueEntryId\) \{\s*onAcknowledgeCurrentEntry\?\.\(currentEntry\);\s*return;\s*\}/,
  'Clicking the held story entry should acknowledge the visible line before other UI can advance.',
);

assert.match(
  dialogueSource,
  /dialogue-gate-notice[\s\S]*下一句已准备好[\s\S]*点击“继续”/,
  'DialogueBox should visibly explain that the next line is ready and waiting for the user to continue.',
);

assert.match(
  dialogueSource,
  /heldDialogueEntryId\?: string/,
  'DialogueBox should accept an App-level held dialogue id so fast system events cannot flash over an unacknowledged role line.',
);

assert.match(
  dialogueSource,
  /function getVisibleCurrentEntry\(history: DialogueHistoryEntry\[\], heldDialogueEntryId = ''\): DialogueHistoryEntry \| null \{[\s\S]*const heldEntry = history\.find\(\(entry\) => entry\.id === heldDialogueEntryId\);[\s\S]*return heldEntry \|\| history\[history\.length - 1\] \|\| null;/,
  'DialogueBox should keep an unacknowledged role line visible until the user confirms it, then fall through to the latest system progress line.',
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
  /function isNarrativeSystemEntry\(entry: DialogueHistoryEntry\): boolean \{[\s\S]*entry\.kind !== 'system'[\s\S]*return !\([\s\S]*已请求继续生成下一句[\s\S]*已收到继续请求[\s\S]*\);[\s\S]*\}/,
  'Operational continue notices should not force extra acknowledgements, but lifecycle system progress should.',
);

assert.match(
  appSource,
  /if \(!playerDialogMayAutoOpen\) return;[\s\S]*setPlayerDialogOpen\(true\);/,
  'The auto-open effect must be gated by playerDialogMayAutoOpen.',
);

assert.match(
  appSource,
  /onAcknowledgeCurrentEntry=\{\(entry\) => \{[\s\S]*setAcknowledgedDialogueEntryId\(entry\.id\);/,
  'DialogueBox acknowledgement should update the App-level latest story acknowledgement state.',
);

assert.match(
  dialogueSource,
  /if \(currentEntry\?\.id === heldDialogueEntryId\) \{\s*onAcknowledgeCurrentEntry\?\.\(currentEntry\);\s*return;\s*\}/,
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
  /if \(dialogueGate\.pending\) return;/,
  'Dialogue continue should not send duplicate requests while the same gate is already pending.',
);

assert.doesNotMatch(
  vnReducerSource,
  /case 'player-lawyer-input-required':\s*return appendSystemLine\(state, '轮到用户处理当前角色任务：请准备输入回复或处理文书任务。'\);/,
  'Player input requests should not append a system line into the main story history.',
);

assert.match(
  vnReducerSource,
  /DEFENDANT_ARRIVED:\s*'被告已收到法院送达，正在前往律所咨询应对。'/,
  'The defendant arrival event should explain that the defendant is responding to service, not fall back to generic case progress text.',
);
