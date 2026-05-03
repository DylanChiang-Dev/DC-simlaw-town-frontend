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
  /src="\/art\/vn\/bg-login-law-office-v3\.png"/,
  'LoginPanel should use the dedicated v3 full-screen login CG background.',
);

assert.match(
  loginPanelSource,
  /className="auth-cg-scene"[\s\S]*className="auth-background"[\s\S]*className="auth-cg-light-sweep"[\s\S]*className="auth-cg-case-lines"[\s\S]*className="auth-cg-dust"[\s\S]*className="auth-cg-screen-glow"/,
  'LoginPanel should wrap the login CG in a layered animated scene instead of rendering only a static image.',
);

assert.match(
  loginPanelSource,
  /LOGIN_CASE_MEMORY_IMAGES[\s\S]*cg-case1-hair-salon-rent-evidence\.png[\s\S]*cg-case3-swimming-pool-loan-evidence\.png[\s\S]*cg-case5-car-purchase-evidence\.png[\s\S]*cg-case6-fabric-iou-evidence\.png[\s\S]*cg-case7-shanghai-traffic-accident-overview\.png[\s\S]*cg-case9-traffic-accident-overview\.png/,
  'LoginPanel should reuse six case CGs as animated login case-memory fragments.',
);

assert.match(
  loginPanelSource,
  /className="auth-art-layer"[\s\S]*src="\/art\/vn\/login-layer-legal-evidence-v2\.png"[\s\S]*className="auth-case-memory-wall"[\s\S]*LOGIN_CASE_MEMORY_IMAGES\.map/,
  'LoginPanel should add a generated legal evidence foreground layer and a dynamic case-memory wall.',
);

assert.match(
  loginPanelSource,
  /aria-hidden="true"[\s\S]*auth-cg-light-sweep[\s\S]*aria-hidden="true"[\s\S]*auth-cg-case-lines[\s\S]*aria-hidden="true"[\s\S]*auth-cg-dust[\s\S]*aria-hidden="true"[\s\S]*auth-cg-screen-glow/,
  'Decorative login CG animation layers should be hidden from assistive technology.',
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
  loginPanelSource,
  /AuthMode = 'login' \| 'register'[\s\S]*注册[\s\S]*确认密码[\s\S]*注册并进入案件/,
  'LoginPanel should provide a register mode with confirm-password validation and a register submit button.',
);

assert.match(
  loginPanelSource,
  /register\(email\.trim\(\), password\)/,
  'Register mode should call the frontend register API wrapper.',
);

assert.doesNotMatch(
  loginPanelSource,
  /auth-panel-tabs/,
  'The v2 login panel should not restore the legacy auth-panel-tabs DOM structure.',
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

assert.doesNotMatch(
  stylesSource,
  /\.auth-stage\s*\{[\s\S]*width:\s*min\(1120px,\s*100%\)/,
  'Auth stage should no longer be constrained to a centered 1120px stage.',
);

assert.match(
  stylesSource,
  /\.auth-stage\s*\{[\s\S]*width:\s*100%[\s\S]*min-height:\s*100vh/,
  'Auth stage should fill the full browser viewport.',
);

assert.match(
  stylesSource,
  /\.auth-shell\s*\{[\s\S]*padding:\s*0/,
  'Auth shell should not add an outer frame around the full-screen image.',
);

assert.match(
  stylesSource,
  /\.auth-stage\s*\{[\s\S]*padding-inline-start:\s*clamp\(56px,\s*8vw,\s*132px\)/,
  'The full-screen login panel should sit slightly farther right on desktop.',
);

assert.match(
  stylesSource,
  /\.auth-cg-scene\s*\{[\s\S]*position:\s*absolute[\s\S]*inset:\s*0[\s\S]*overflow:\s*hidden/,
  'The login CG should have a full-viewport scene container for animated layers.',
);

assert.match(
  stylesSource,
  /\.auth-background\s*\{[\s\S]*animation:\s*loginCgDrift/,
  'The login CG background should have a slow cinematic drift animation.',
);

assert.match(
  stylesSource,
  /@keyframes loginCgDrift[\s\S]*@keyframes loginLightSweep[\s\S]*@keyframes loginCaseLines[\s\S]*@keyframes loginDust[\s\S]*@keyframes loginScreenGlow/,
  'The login page should define CSS-only keyframes for the layered CG motion.',
);

assert.match(
  stylesSource,
  /\.auth-art-layer\s*\{[\s\S]*object-fit:\s*cover[\s\S]*animation:\s*loginArtLayerFloat/,
  'The generated legal evidence layer should be rendered as an animated foreground art layer.',
);

assert.match(
  stylesSource,
  /\.auth-case-memory-wall\s*\{[\s\S]*position:\s*absolute[\s\S]*\.auth-case-polaroid\s*\{[\s\S]*animation:\s*loginCaseMemoryFloat/,
  'The login page should animate case CG fragments as a case-memory wall.',
);

assert.match(
  stylesSource,
  /@keyframes loginArtLayerFloat[\s\S]*@keyframes loginCaseMemoryFloat/,
  'The login page should define dedicated keyframes for foreground art and case-memory fragments.',
);

assert.match(
  stylesSource,
  /@media \(prefers-reduced-motion:\s*reduce\)[\s\S]*\.auth-background[\s\S]*animation:\s*none[\s\S]*\.auth-cg-light-sweep[\s\S]*animation:\s*none[\s\S]*\.auth-cg-case-lines[\s\S]*animation:\s*none[\s\S]*\.auth-cg-dust[\s\S]*animation:\s*none[\s\S]*\.auth-cg-screen-glow[\s\S]*animation:\s*none[\s\S]*\.auth-art-layer[\s\S]*animation:\s*none[\s\S]*\.auth-case-polaroid[\s\S]*animation:\s*none/,
  'The login CG motion should respect prefers-reduced-motion by disabling looping animations.',
);

assert.match(
  stylesSource,
  /\.login-mode-switch\s*\{[\s\S]*grid-template-columns:\s*1fr 1fr/,
  'Login and register actions should share a compact two-button mode switch.',
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
