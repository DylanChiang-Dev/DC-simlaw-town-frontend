import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const componentSource = readFileSync(join(root, 'src', 'components', 'TownRadar.tsx'), 'utf8');
const appSource = readFileSync(join(root, 'src', 'App.tsx'), 'utf8');
const stylesSource = readFileSync(join(root, 'src', 'styles.css'), 'utf8');
const sideRailIndex = appSource.indexOf('<div className="side-rail">');
const storySurfaceIndex = appSource.indexOf('<div className="story-surface">');
const dialogueDockIndex = appSource.indexOf('<div className="dialogue-dock">');
const dialogueBoxIndex = appSource.indexOf('<DialogueBox');
const townRadarRenderIndex = appSource.indexOf('<TownRadar');

assert.match(
  componentSource,
  /aria-label="小镇运行雷达"/,
  'TownRadar should expose an accessible noninteractive region label.',
);

assert.match(
  componentSource,
  /律所 A[\s\S]*律所 B[\s\S]*一审法院[\s\S]*二审法院/,
  'TownRadar should render all four required destinations.',
);

assert.match(
  componentSource,
  /前台[\s\S]*咨询室[\s\S]*律师工位\/文书起草/,
  'TownRadar should render the three law firm internal nodes.',
);

assert.doesNotMatch(
  componentSource,
  /<button|onClick|role="button"|tabIndex=\{0\}/,
  'TownRadar must remain noninteractive.',
);

assert.match(
  componentSource,
  /scene\.tech\.activeTools[\s\S]*scene\.tech\.activeSkills/,
  'TownRadar should derive its compact recent-capability line from existing scene tech state.',
);

assert.match(
  componentSource,
  /town-radar-legend[\s\S]*actor\.label/,
  'TownRadar should render actor names in a compact color legend outside the map.',
);

assert.match(
  componentSource,
  /town-radar-actor-dot[\s\S]*aria-hidden="true"/,
  'TownRadar should render color-only actor dots on the map.',
);

assert.match(
  componentSource,
  /const actorLayouts = getActorLayouts\(radar\.visibleActors,\s*destination\.locationId\);/,
  'TownRadar should compute per-actor layouts so same-room dots do not overlap.',
);

assert.match(
  componentSource,
  /function groupActorPositionKey\(actor: RadarActor,[\s\S]*actor\.locationId \|\| fallbackLocationId[\s\S]*actor\.nodeId \|\| 'main'/,
  'TownRadar should group actor dots by location and internal room before spreading them.',
);

assert.match(
  componentSource,
  /function getActorOffset\(index: number,\s*total: number\)[\s\S]*offsetX:\s*-2\.8[\s\S]*offsetX:\s*2\.8/,
  'TownRadar should place two actors in the same room side by side instead of directly overlapping.',
);

assert.doesNotMatch(
  componentSource,
  /formatActorLabel/,
  'TownRadar map markers should not print actor name text inside the map.',
);

assert.match(
  appSource,
  /<div className="dialogue-dock">[\s\S]*<DialogueBox[\s\S]*<TownRadar/,
  'App should render TownRadar as a right-side block inside the dialogue dock.',
);

assert.ok(
  sideRailIndex >= 0 && storySurfaceIndex > sideRailIndex && townRadarRenderIndex > storySurfaceIndex,
  'TownRadar should no longer render inside the left status rail.',
);

assert.ok(
  storySurfaceIndex >= 0
    && dialogueDockIndex > storySurfaceIndex
    && dialogueBoxIndex > dialogueDockIndex
    && townRadarRenderIndex > dialogueBoxIndex,
  'TownRadar should sit parallel to the dialogue box inside the main story surface.',
);

assert.match(
  stylesSource,
  /\.dialogue-dock\s*\{[\s\S]*position:\s*absolute;[\s\S]*left:\s*24px;[\s\S]*right:\s*24px;[\s\S]*bottom:\s*22px;[\s\S]*grid-template-columns:\s*minmax\(0,\s*1fr\) minmax\(300px,\s*340px\);/,
  'The dialogue dock should align the dialogue box and TownRadar as bottom parallel blocks.',
);

assert.match(
  stylesSource,
  /\.town-radar\s*\{[\s\S]*width:\s*100%;/,
  'TownRadar should fill its dialogue-dock side block instead of floating independently.',
);

assert.match(
  stylesSource,
  /\.town-radar-map\s*\{[\s\S]*height:\s*132px;/,
  'TownRadar map should use a slightly rectangular lower-right layout.',
);

assert.match(
  stylesSource,
  /\.town-radar-legend\s*\{[\s\S]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\);/,
  'TownRadar legend should use two compact columns in the wider lower-right dock.',
);
