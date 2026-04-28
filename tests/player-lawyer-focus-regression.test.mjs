import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const appSource = readFileSync(join(root, 'src', 'App.tsx'), 'utf8');
const runtimeSource = readFileSync(join(root, 'src', 'state', 'usePlayerLawyerRuntime.ts'), 'utf8');

assert.match(
  runtimeSource,
  /actionLoading:\s*boolean/,
  'usePlayerLawyerRuntime should expose a separate actionLoading flag for user-initiated operations.',
);

assert.match(
  appSource,
  /<PlayerLawyerInputDialog[\s\S]*?loading=\{playerLawyer\.actionLoading\}/,
  'PlayerLawyerInputDialog must not receive background refresh loading because disabling a focused textarea drops focus.',
);

assert.doesNotMatch(
  appSource,
  /<PlayerLawyerInputDialog[\s\S]*?loading=\{playerLawyer\.loading\}/,
  'PlayerLawyerInputDialog should not disable controls during background polling refreshes.',
);

assert.match(
  runtimeSource,
  /catch \(err\) \{[\s\S]*setError\(err instanceof Error \? err\.message : '提交当前角色回复失败'\);[\s\S]*throw err;[\s\S]*\} finally \{/,
  'Player text submit failures must be rethrown so the dialog does not close or append a fake submitted line.',
);
