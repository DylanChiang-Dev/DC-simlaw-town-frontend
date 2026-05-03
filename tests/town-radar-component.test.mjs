import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const componentSource = readFileSync(join(root, 'src', 'components', 'TownRadar.tsx'), 'utf8');
const appSource = readFileSync(join(root, 'src', 'App.tsx'), 'utf8');
const stylesSource = readFileSync(join(root, 'src', 'styles.css'), 'utf8');

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

assert.doesNotMatch(
  componentSource,
  /formatActorLabel/,
  'TownRadar map markers should not print actor name text inside the map.',
);

assert.match(
  appSource,
  /<div className="side-rail">[\s\S]*<TechLedger[\s\S]*<TownRadar/,
  'App should render TownRadar at the bottom of the left status rail.',
);

assert.doesNotMatch(
  appSource,
  /<div className="story-surface">[\s\S]*<TownRadar/,
  'TownRadar should not render inside the main story surface.',
);

assert.match(
  stylesSource,
  /\.side-rail\s*\{[\s\S]*grid-template-rows:\s*auto minmax\(0,\s*1fr\) auto;/,
  'The left status rail should reserve a bottom row for TownRadar.',
);

assert.match(
  stylesSource,
  /\.town-radar\s*\{[\s\S]*position:\s*relative;/,
  'TownRadar should be a normal left-rail panel instead of a stage overlay.',
);

assert.match(
  stylesSource,
  /\.town-radar-map\s*\{[\s\S]*height:\s*118px;/,
  'TownRadar map should use a flatter compact layout for the left rail.',
);

assert.match(
  stylesSource,
  /\.town-radar-legend\s*\{[\s\S]*grid-template-columns:\s*1fr;/,
  'TownRadar legend should use a compact single-column layout in the left rail.',
);
