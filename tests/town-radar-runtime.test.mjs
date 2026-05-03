import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const runtimeSource = readFileSync(join(root, 'src', 'state', 'useTownRadarRuntime.ts'), 'utf8');

assert.match(
  runtimeSource,
  /eventBus\.on\('ws:map-event',\s*handleMapEvent\)/,
  'Town radar runtime should subscribe to existing ws:map-event messages.',
);

assert.match(
  runtimeSource,
  /eventBus\.off\('ws:map-event',\s*handleMapEvent\)/,
  'Town radar runtime should unsubscribe from ws:map-event on cleanup.',
);

assert.match(
  runtimeSource,
  /export function reduceTownRadarMapEvent\(/,
  'The map-event reducer should be exported for focused tests and future reuse.',
);

assert.match(
  runtimeSource,
  /case 'agent_move':[\s\S]*normalizeRadarLocationId\(payload\.dest_loc_id,\s*fallbackStageCode\)[\s\S]*moving:\s*true/,
  'agent_move should update the target destination and mark the actor as moving.',
);

assert.match(
  runtimeSource,
  /case 'agent_despawn':[\s\S]*delete nextActors\[agentId\]/,
  'agent_despawn should remove the actor from radar state.',
);

assert.match(
  runtimeSource,
  /rawLocationId/,
  'Unknown or raw destination ids should be retained for debugging.',
);

assert.match(
  runtimeSource,
  /getActorDisplayLabel\(payload,\s*current\?\.label,\s*agentId\)/,
  'Town radar actor labels should prefer business names over character asset names.',
);

assert.match(
  runtimeSource,
  /payload\.name[\s\S]*payload\.speaker_name[\s\S]*payload\.display_name[\s\S]*payload\.profile_name/,
  'Town radar display labels should read business-facing name fields before character_name.',
);

assert.match(
  runtimeSource,
  /Conference_man[\s\S]*法官/,
  'Town radar should translate character asset names like Conference_man into business-facing labels.',
);

assert.match(
  runtimeSource,
  /currentLabel[\s\S]*isCharacterAssetName/,
  'Town radar should not keep a previously cached character asset name as the visible label.',
);

assert.doesNotMatch(
  runtimeSource,
  /payload\.character_name\s*\|\|\s*payload\.name/,
  'Town radar must not prefer character_name before business name fields.',
);

assert.doesNotMatch(
  runtimeSource,
  /fetch\(|axios|apiClient|getWebSocketService\(\)\.send/,
  'Town radar runtime must not call backend APIs or send WebSocket commands.',
);
