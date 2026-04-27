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
  /if \(currentEntry\?\.kind === 'dialogue'\) \{\s*onAcknowledgeCurrentEntry\?\.\(currentEntry\);\s*\}/,
  'Clicking the current dialogue should acknowledge a visible role line before other UI can advance.',
);

assert.match(
  dialogueSource,
  /dialogue-gate-notice[\s\S]*下一句已准备好[\s\S]*后端正在等待继续/,
  'DialogueBox should visibly explain that the backend is waiting for the user to continue.',
);

assert.match(
  appSource,
  /const \[acknowledgedDialogueEntryId, setAcknowledgedDialogueEntryId\] = useState\(''\);/,
  'App should track whether the latest visible role dialogue has been acknowledged.',
);

assert.match(
  appSource,
  /const latestDialogueEntry = getLatestDialogueEntry\(vnRuntime\.history\);/,
  'App should derive the latest role dialogue entry from VN history.',
);

assert.match(
  appSource,
  /const playerDialogMayAutoOpen = !latestDialogueEntry \|\| latestDialogueEntry\.id === acknowledgedDialogueEntryId;/,
  'Player task dialogs should auto-open only after the latest role dialogue has been acknowledged.',
);

assert.match(
  appSource,
  /if \(!playerDialogMayAutoOpen\) return;[\s\S]*setPlayerDialogOpen\(true\);/,
  'The auto-open effect must be gated by playerDialogMayAutoOpen.',
);

assert.match(
  appSource,
  /onAcknowledgeCurrentEntry=\{\(entry\) => \{[\s\S]*setAcknowledgedDialogueEntryId\(entry\.id\);/,
  'DialogueBox acknowledgement should update the App-level latest dialogue acknowledgement state.',
);

assert.doesNotMatch(
  vnReducerSource,
  /case 'player-lawyer-input-required':\s*return appendSystemLine\(state, '轮到用户处理当前角色任务：请准备输入回复或处理文书任务。'\);/,
  'Player input requests should not append a system line into the main story history.',
);
