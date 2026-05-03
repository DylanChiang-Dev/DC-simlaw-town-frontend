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
  /case 'agent_goto_front_desk':[\s\S]*normalizeRadarLocationId\([\s\S]*payload\.lawfirm[\s\S]*fallbackStageCode\)/,
  'agent_goto_front_desk should place the client at the correct law firm instead of falling back to SYSTEM.',
);

assert.match(
  runtimeSource,
  /case 'agent_update_dialogue':[\s\S]*const current = state\.actors\[agentId\];[\s\S]*locationId:\s*current\.locationId/,
  'agent_update_dialogue should keep the speaking actor at its last real map location.',
);

assert.match(
  runtimeSource,
  /case 'agent_update_dialogue':[\s\S]*inferReceptionistLocationFromAgentId\(agentId,[\s\S]*fallbackStageCode\)/,
  'Receptionist dialogue should infer its law firm from ids like receptionist_law_firm_B when no move event exists.',
);

assert.match(
  runtimeSource,
  /function inferReceptionistLocationFromAgentId\(agentId: string,[\s\S]*law_firm_b[\s\S]*lawfirmB_front_desk[\s\S]*law_firm_a[\s\S]*lawfirmA_front_desk/,
  'Receptionist ids should map to their matching front desk instead of defaulting to law firm A.',
);

assert.match(
  runtimeSource,
  /mergeRadarActorsByLabel\(\[\.\.\.runtimeActors,\s*\.\.\.stageActors\]\)/,
  'Town radar should merge stage speaker activity into runtime actors without replacing their real map location.',
);

assert.match(
  runtimeSource,
  /return \{\s*\.\.\.candidate,\s*locationId:\s*current\.locationId,[\s\S]*active:\s*current\.active \|\| candidate\.active/,
  'When the stage speaker matches a runtime actor, the runtime map location should win while active state is preserved.',
);

assert.match(
  runtimeSource,
  /case 'agent_despawn':[\s\S]*delete nextActors\[agentId\]/,
  'agent_despawn should remove the actor from radar state.',
);

assert.match(
  runtimeSource,
  /case 'agent_end_interaction':[\s\S]*if \(!isReceptionistAgentId\(agentId\)\) return state;[\s\S]*delete nextActors\[agentId\]/,
  'Receptionist end-interaction events should remove the temporary front-desk NPC from the radar.',
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
  /if \(isReceptionistAgentId\(agentId\)\) return '律所前台';/,
  'Receptionist map events should share the VN receptionist label so runtime and stage actors merge.',
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
  /normalizeActorLabelKey/,
  'Town radar should use normalized business labels to collapse duplicate actors with different ids.',
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
