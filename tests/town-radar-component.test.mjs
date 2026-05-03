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
  appSource,
  /import \{ TownRadar \} from '\.\/components\/TownRadar';[\s\S]*<TownRadar/,
  'App should render TownRadar inside the story surface.',
);

assert.match(
  stylesSource,
  /\.town-radar\s*\{[\s\S]*position:\s*absolute;[\s\S]*right:\s*18px;[\s\S]*top:\s*18px;/,
  'TownRadar should be positioned as a right-top picture-in-picture overlay.',
);
