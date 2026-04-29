import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const appSource = readFileSync(join(root, 'src', 'App.tsx'), 'utf8');
const commandHudSource = readFileSync(join(root, 'src', 'components', 'CommandHud.tsx'), 'utf8');
const dialogueSource = readFileSync(join(root, 'src', 'components', 'DialogueBox.tsx'), 'utf8');

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
  /<button className="hud-button" disabled=\{loading\} onClick=\{\(\) => void onRefresh\?\.\(\)\} type="button">\s*刷新\s*<\/button>/,
  'CommandHud should keep the global refresh button for real sandbox status refreshes.',
);

assert.match(
  dialogueSource,
  /action: onResumeCurrentCase \? \{ label: '继续当前案件', run: onResumeCurrentCase \} : undefined/,
  'Paused cases should keep the real resume action in DialogueBox.',
);

assert.match(
  dialogueSource,
  /案件正在运行，但页面还没有收到下一条实时对话。系统会继续等待实时连接推送/,
  'Running-without-dialogue notice should explain waiting for realtime events instead of suggesting local refresh recovery.',
);
