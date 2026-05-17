import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const runtimeSource = readFileSync(join(root, 'src', 'state', 'usePlayerLawyerRuntime.ts'), 'utf8');
const apiSource = readFileSync(join(root, 'src', 'services', 'playerLawyerApi.ts'), 'utf8');

assert.doesNotMatch(
  runtimeSource,
  /const POLL_INTERVAL_MS = 10000/,
  'Player-lawyer runtime should not poll every 10 seconds after the production load incident.',
);

assert.match(
  runtimeSource,
  /const BASE_POLL_INTERVAL_MS = 45000/,
  'Player-lawyer runtime should use a 45 second slow-poll fallback.',
);

assert.match(
  runtimeSource,
  /const MAX_POLL_INTERVAL_MS = 120000/,
  'Player-lawyer runtime should cap failed-refresh backoff at 120 seconds.',
);

assert.match(
  runtimeSource,
  /document\.addEventListener\('visibilitychange', handleVisibilityChange\)/,
  'Player-lawyer runtime should pause fallback polling while the page is hidden and refresh when visible.',
);

assert.match(
  runtimeSource,
  /fetchPlayerLawyerRuntime\(caseId\)/,
  'Player-lawyer runtime should use the backend aggregate runtime endpoint for regular refreshes.',
);

assert.doesNotMatch(
  runtimeSource,
  /Promise\.all\(\[\s*fetchPlayerLawyerStatus\(\),\s*fetchPendingPlayerLawyerRequests\(caseId\),\s*\]\)/,
  'Regular refresh should not call status and pending as two separate backend requests.',
);

assert.match(
  apiSource,
  /fetchPlayerLawyerRuntime[\s\S]*\/api\/sandbox\/player-lawyer\/runtime/,
  'The frontend API client should expose the aggregate player-lawyer runtime endpoint.',
);
