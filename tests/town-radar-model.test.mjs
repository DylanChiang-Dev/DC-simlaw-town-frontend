import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const modelSource = readFileSync(join(root, 'src', 'data', 'townRadarModel.ts'), 'utf8');

assert.match(
  modelSource,
  /export const TOWN_RADAR_LOCATIONS[\s\S]*id:\s*'lawfirmA'[\s\S]*label:\s*'律所 A'[\s\S]*id:\s*'lawfirmB'[\s\S]*label:\s*'律所 B'[\s\S]*id:\s*'courtFirstInstance'[\s\S]*label:\s*'一审法院'[\s\S]*id:\s*'courtSecondInstance'[\s\S]*label:\s*'二审法院'/,
  'Town radar should define law firm A, law firm B, first-instance court, and second-instance court.',
);

assert.match(
  modelSource,
  /export const LAWFIRM_INTERNAL_NODES[\s\S]*frontDesk[\s\S]*label:\s*'前台'[\s\S]*consultationRoom[\s\S]*label:\s*'咨询室'[\s\S]*workstation[\s\S]*label:\s*'律师工位\/文书起草'/,
  'Law firms should expose exactly the planned internal nodes.',
);

assert.doesNotMatch(
  modelSource,
  /中央文书台|centralDocumentDesk|documentDesk/,
  'Radar model must not introduce a central document desk.',
);

for (const [stage, location] of [
  ['PLC', 'lawfirmA'],
  ['CD', 'lawfirmA'],
  ['DLC', 'lawfirmB'],
  ['DD', 'lawfirmB'],
  ['CI', 'courtFirstInstance'],
  ['CIA', 'courtSecondInstance'],
  ['FINAL_VERDICT', 'courtSecondInstance'],
]) {
  assert.match(
    modelSource,
    new RegExp(`${stage}:\\s*\\{[\\s\\S]*locationId:\\s*'${location}'`),
    `${stage} should map to ${location}.`,
  );
}

assert.match(
  modelSource,
  /AD:\s*\{[\s\S]*resolveSide:\s*'appellant'/,
  'AD should resolve to the appellant-side law firm during runtime.',
);

assert.match(
  modelSource,
  /AR:\s*\{[\s\S]*resolveSide:\s*'appellee'/,
  'AR should resolve to the appellee-side law firm during runtime.',
);

assert.match(
  modelSource,
  /function normalizeRadarLocationId\([\s\S]*lawfirmA[\s\S]*lawfirmB[\s\S]*courtFirstInstance[\s\S]*courtSecondInstance/,
  'normalizeRadarLocationId should normalize raw map location ids into abstract radar destinations.',
);

assert.match(
  modelSource,
  /export function getPriorityRadarActors\(/,
  'The model should expose a priority helper so the component can keep the radar uncluttered.',
);

assert.match(
  modelSource,
  /if \(!scene\.speaker \|\| String\(scene\.speaker\) === 'system'\) return \[\];/,
  'Town radar should not create a visible actor dot for the system placeholder speaker.',
);
