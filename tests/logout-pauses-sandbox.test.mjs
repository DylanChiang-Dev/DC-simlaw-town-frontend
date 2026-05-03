import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const authGateSource = readFileSync(join(root, 'src', 'components', 'AuthGate.tsx'), 'utf8');

assert.match(
  authGateSource,
  /import \{ ensureSandbox, pauseSimulation \} from '\.\.\/services\/sandboxApi';/,
  'AuthGate should import pauseSimulation so logout can stop the current sandbox before clearing the auth token.',
);

assert.match(
  authGateSource,
  /import \{ getWebSocketService \} from '\.\.\/services\/webSocket';/,
  'AuthGate should notify the active WebSocket that logout is intentional before disconnecting.',
);

assert.match(
  authGateSource,
  /async function handleLogout\(\): Promise<void> \{[\s\S]*getWebSocketService\(\)\.send\(\{ type: 'client_logout' \}\);[\s\S]*await pauseSimulation\(\);[\s\S]*authService\.logout\(\);/,
  'Logout should notify realtime clients and await sandbox pause before authService.logout clears the bearer token.',
);

assert.match(
  authGateSource,
  /catch \(err\) \{[\s\S]*console\.warn\('Failed to pause sandbox before logout:', err\);[\s\S]*\}[\s\S]*authService\.logout\(\);/,
  'A pause failure should not trap the user in the app, but it should be visible in developer logs.',
);
