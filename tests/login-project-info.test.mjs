import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const loginPanelSource = readFileSync(join(root, 'src', 'components', 'LoginPanel.tsx'), 'utf8');
const runtimeSource = readFileSync(join(root, 'src', 'services', 'runtime.ts'), 'utf8');
const stylesSource = readFileSync(join(root, 'src', 'styles.css'), 'utf8');
const projectInfoPath = join(root, 'src', 'config', 'projectInfo.ts');

assert.ok(
  existsSync(projectInfoPath),
  'frontend-v2 should keep migrated project login copy in src/config/projectInfo.ts.',
);

const projectInfoSource = existsSync(projectInfoPath) ? readFileSync(projectInfoPath, 'utf8') : '';

assert.match(
  projectInfoSource,
  /PROJECT_CONTACT_EMAIL\s*=\s*'sbyue23@m\.fudan\.edu\.cn'/,
  'Project contact email should match the legacy login page.',
);

assert.match(
  projectInfoSource,
  /PROJECT_INFO_TITLE\s*=\s*'关于 SimAilaw Town'/,
  'Project info title should match the legacy login page.',
);

assert.match(
  projectInfoSource,
  /PROJECT_INFO_COPY[\s\S]*咨询、文书起草、庭审推进[\s\S]*PROJECT_CONTACT_EMAIL/,
  'Project info copy should carry over the legacy introduction and interpolate the contact email.',
);

assert.match(
  projectInfoSource,
  /PROJECT_SURVEY_LABEL\s*=\s*'填写体验问卷'/,
  'Project survey button label should match the legacy login page.',
);

assert.match(
  loginPanelSource,
  /import \{[\s\S]*PROJECT_CONTACT_EMAIL[\s\S]*PROJECT_INFO_COPY[\s\S]*PROJECT_INFO_TITLE[\s\S]*PROJECT_SURVEY_LABEL[\s\S]*\} from '\.\.\/config\/projectInfo';/,
  'LoginPanel should import the migrated project info constants.',
);

assert.match(
  loginPanelSource,
  /getSimulationSurveyUrl/,
  'LoginPanel should use the shared runtime survey URL resolver.',
);

assert.match(
  loginPanelSource,
  /className="login-project-card"[\s\S]*\{PROJECT_INFO_TITLE\}[\s\S]*\{PROJECT_INFO_COPY\}[\s\S]*\{PROJECT_SURVEY_LABEL\}/,
  'LoginPanel should render the project introduction and survey action.',
);

assert.match(
  loginPanelSource,
  /href=\{`mailto:\$\{PROJECT_CONTACT_EMAIL\}`\}[\s\S]*联系邮箱：\{PROJECT_CONTACT_EMAIL\}/,
  'LoginPanel should render a mailto contact link with the migrated email.',
);

assert.match(
  loginPanelSource,
  /忘记密码？[\s\S]*请跟开发者联系[\s\S]*PROJECT_CONTACT_EMAIL/,
  'LoginPanel should expose the legacy forgot-password contact notice.',
);

assert.match(
  runtimeSource,
  /SURVEY_URL\?: string;/,
  'Runtime config should accept optional SURVEY_URL from runtime-config.js.',
);

assert.match(
  runtimeSource,
  /DEFAULT_SIMULATION_SURVEY_URL\s*=\s*'https:\/\/v\.wjx\.cn\/vm\/wQgDTfJ\.aspx'/,
  'Runtime config should keep the legacy default questionnaire URL.',
);

assert.match(
  runtimeSource,
  /VITE_SIMULATION_SURVEY_URL/,
  'Runtime config should allow Vite env override for the questionnaire URL.',
);

assert.match(
  runtimeSource,
  /export function getSimulationSurveyUrl\(\): string \| null/,
  'Runtime config should export getSimulationSurveyUrl for login page actions.',
);

assert.match(
  stylesSource,
  /\.login-project-card\s*\{[\s\S]*border:\s*1px solid/,
  'Login project info should have a dedicated compact card style.',
);

assert.match(
  stylesSource,
  /\.login-forgot-notice\s*\{[\s\S]*word-break:\s*break-all/,
  'Forgot-password contact notice should wrap long email addresses safely.',
);
