import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const appSource = readFileSync(join(root, 'src', 'App.tsx'), 'utf8');
const commandHudSource = readFileSync(join(root, 'src', 'components', 'CommandHud.tsx'), 'utf8');
const dialogueSource = readFileSync(join(root, 'src', 'components', 'DialogueBox.tsx'), 'utf8');
const commandHudUsage = appSource.match(/<CommandHud[\s\S]*?\/>/)?.[0] || '';
const casePickerUsage = appSource.match(/<CasePicker[\s\S]*?\/>/)?.[0] || '';

assert.doesNotMatch(
  dialogueSource,
  /onRefreshRuntime/,
  'DialogueBox should not expose or call a local refresh-status action because it cannot recover missed websocket dialogue.',
);

assert.doesNotMatch(
  dialogueSource,
  /刷新状态/,
  'DialogueBox fallback notices should not render a misleading "刷新状态" button.',
);

assert.doesNotMatch(
  appSource,
  /onRefreshRuntime=\{runtime\.refresh\}/,
  'App should not pass runtime.refresh into DialogueBox as a local dialogue recovery action.',
);

assert.doesNotMatch(
  appSource,
  /请刷新状态/,
  'App-level dialogue timeout copy should not suggest local refresh as a dialogue recovery action.',
);

assert.match(
  commandHudSource,
  /aria-label="操作"/,
  'CommandHud should still render the top operation area.',
);

assert.doesNotMatch(
  commandHudSource,
  /onRefresh/,
  'CommandHud should not expose a top-level refresh action because users expect refresh to recover dialogue state.',
);

assert.doesNotMatch(
  commandHudSource,
  />\s*刷新\s*</,
  'CommandHud should not render the misleading top refresh button.',
);

assert.doesNotMatch(
  commandHudUsage,
  /onRefresh=/,
  'App should not pass runtime.refresh into CommandHud after removing the top refresh button.',
);

assert.match(
  casePickerUsage,
  /onRefresh=\{runtime\.refresh\}/,
  'CasePicker should keep its explicit case-list refresh action.',
);

assert.match(
  dialogueSource,
  /action: onResumeCurrentCase \? \{ label: '继续当前案件', run: onResumeCurrentCase \} : undefined/,
  'Paused cases should keep the real resume action in DialogueBox.',
);

assert.match(
  dialogueSource,
  /message: runtimeProgressNotice \|\| 'Agent 正在生成下一句\.\.\.'/,
  'Running-without-dialogue inline notice should be short and explain that Agent generation is in progress.',
);

assert.match(
  dialogueSource,
  /className=\{`dialogue-floating-status \$\{inlineNotice\.tone\}`\}/,
  'The waiting-for-agent notice should render as a floating frosted capsule rather than replacing the current dialogue body.',
);

assert.doesNotMatch(
  dialogueSource,
  /下一句已准备好|点击“继续”|onContinueDialogue/,
  'The waiting-for-agent notice should not restore a visible continue prompt or manual dialogue continue control.',
);
