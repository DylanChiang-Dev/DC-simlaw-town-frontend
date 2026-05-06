import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));

function readSource(relativePath) {
  return readFileSync(join(root, relativePath), "utf8");
}

const appPath = join(root, "src", "App.tsx");
const commandHudPath = join(root, "src", "components", "CommandHud.tsx");
const guidePath = join(root, "src", "components", "OnboardingGuideDialog.tsx");
const coachPath = join(root, "src", "components", "OnboardingCoach.tsx");
const contentPath = join(root, "src", "onboarding", "onboardingContent.ts");
const statePath = join(root, "src", "onboarding", "useOnboardingState.ts");
const runtimePath = join(root, "src", "onboarding", "onboardingRuntime.ts");
const stylesPath = join(root, "src", "styles.css");

for (const path of [guidePath, coachPath, contentPath, statePath, runtimePath]) {
  assert.equal(existsSync(path), true, `${path} should exist.`);
}

const appSource = readFileSync(appPath, "utf8");
const commandHudSource = readFileSync(commandHudPath, "utf8");
const guideSource = readFileSync(guidePath, "utf8");
const coachSource = readFileSync(coachPath, "utf8");
const contentSource = readFileSync(contentPath, "utf8");
const stateSource = readFileSync(statePath, "utf8");
const runtimeSource = readFileSync(runtimePath, "utf8");
const stylesSource = readFileSync(stylesPath, "utf8");
const packageSource = readSource("package.json");

assert.match(
  packageSource,
  /"test:onboarding-guide":\s*"node tests\/onboarding-guide\.test\.mjs"/,
  "package.json should expose a focused onboarding guide test script.",
);

assert.match(
  contentSource,
  /export const ONBOARDING_STEPS[\s\S]*case-picker[\s\S]*opening-dialogue[\s\S]*text-input[\s\S]*document-followup[\s\S]*document-drafting[\s\S]*court-argument[\s\S]*closing-score[\s\S]*markdown-review/s,
  "Onboarding content should cover the full player mainline from case selection to Markdown review.",
);

assert.match(
  contentSource,
  /kind:\s*["']light["'][\s\S]*kind:\s*["']key["']/,
  "Onboarding steps should distinguish light hints from key confirmation hints.",
);

assert.match(
  contentSource,
  /请结合本案事实改写/,
  "Fixed examples should explicitly tell players to adapt them to the current case facts.",
);

assert.match(
  contentSource,
  /评分重点[\s\S]*事实[\s\S]*追问[\s\S]*文书[\s\S]*庭审[\s\S]*复盘/s,
  "Onboarding copy should connect workflow guidance to scoring and review.",
);

assert.match(
  stateSource,
  /ONBOARDING_COMPLETED_STORAGE_KEY\s*=\s*["']simlaw-town:onboarding-v1-completed["']/,
  "Onboarding completion should use a versioned localStorage key.",
);

assert.match(
  stateSource,
  /ONBOARDING_DISMISSED_STEPS_STORAGE_KEY\s*=\s*["']simlaw-town:onboarding-v1-dismissed-steps["']/,
  "Dismissed key hints should use a versioned localStorage key.",
);

assert.match(
  stateSource,
  /localStorage\.getItem\(ONBOARDING_COMPLETED_STORAGE_KEY\)[\s\S]*localStorage\.setItem\(ONBOARDING_COMPLETED_STORAGE_KEY/,
  "Onboarding state should read and write completion through localStorage.",
);

assert.match(
  stateSource,
  /resetOnboarding[\s\S]*localStorage\.removeItem\(ONBOARDING_COMPLETED_STORAGE_KEY\)[\s\S]*localStorage\.removeItem\(ONBOARDING_DISMISSED_STEPS_STORAGE_KEY\)/,
  "Onboarding state should expose a reset action that clears both localStorage keys.",
);

assert.match(
  runtimeSource,
  /nextUnacknowledgedStoryEntryId[\s\S]*return null;/,
  "Runtime mapping should block key coach prompts while an unacknowledged story line exists.",
);

assert.match(
  runtimeSource,
  /visiblePlayerRequestStage[\s\S]*document-followup[\s\S]*document-drafting[\s\S]*court-argument/s,
  "Runtime mapping should map player request stages to document and court onboarding steps.",
);

assert.match(
  runtimeSource,
  /caseClosed[\s\S]*finalCaseClosedLineAcknowledged[\s\S]*closing-score/s,
  "Runtime mapping should show closing-score guidance only after the final closed-case line is acknowledged.",
);

assert.match(
  guideSource,
  /import \{ TaskWorkbenchShell \} from ["']\.\/TaskWorkbenchShell["'];/,
  "Onboarding guide dialog should reuse the shared workbench shell.",
);

assert.match(
  guideSource,
  /<TaskWorkbenchShell[\s\S]*ariaLabel="新手导航"[\s\S]*left=\{[\s\S]*right=\{[\s\S]*footer=\{/,
  "Onboarding guide should provide map, detail, and footer through TaskWorkbenchShell.",
);

assert.match(
  guideSource,
  /重置新手导航[\s\S]*onReset/,
  "The full guide should expose reset onboarding state as an explicit action.",
);

assert.match(
  coachSource,
  /kind === ["']light["'][\s\S]*onDismiss/,
  "Light coach hints should be dismissible without blocking the flow.",
);

assert.match(
  coachSource,
  /kind === ["']key["'][\s\S]*知道了，开始处理[\s\S]*onConfirm/,
  "Key coach hints should require an explicit confirmation before the UI proceeds.",
);

assert.doesNotMatch(
  coachSource,
  /fetch\(|authenticatedFetch|sendPlayerLawyer|generateCaseClosingEvaluation|window\.location/,
  "Onboarding coach should not call backend APIs or navigate.",
);

assert.match(
  commandHudSource,
  /onOpenOnboardingGuide\?: \(\) => void/,
  "CommandHud should accept an onboarding guide open callback.",
);

assert.match(
  commandHudSource,
  /onOpenOnboardingGuide[\s\S]*新手导航/,
  "CommandHud should render a 新手导航 action when the callback is present.",
);

assert.match(
  appSource,
  /useOnboardingState/,
  "App should use the centralized onboarding state hook.",
);

assert.match(
  appSource,
  /getCurrentOnboardingStepId/,
  "App should use the pure runtime mapper for the current onboarding step.",
);

assert.match(
  appSource,
  /onOpenOnboardingGuide=\{onboarding\.openGuide\}/,
  "App should wire CommandHud to the full onboarding guide.",
);

assert.match(
  appSource,
  /<OnboardingGuideDialog[\s\S]*open=\{onboarding\.guideOpen\}[\s\S]*onReset=\{onboarding\.resetOnboarding\}/,
  "App should render the guide dialog with reset support.",
);

assert.match(
  appSource,
  /<OnboardingCoach[\s\S]*step=\{currentOnboardingStep\}[\s\S]*onConfirm=\{handleOnboardingCoachConfirm\}/,
  "App should render the in-flow coach for the mapped current step.",
);

assert.match(
  appSource,
  /const onboardingBlocksPlayerDialog = Boolean\([\s\S]*currentOnboardingStep\?\.kind === 'key'[\s\S]*!onboarding\.isStepDismissed/,
  "App should block player dialog opening while a key onboarding prompt is waiting for confirmation.",
);

assert.match(
  appSource,
  /const visiblePlayerRequestForDialog = onboardingBlocksPlayerDialog \? null : visiblePlayerRequest;/,
  "Player input dialog should use a coach-gated visible request so key hints appear first.",
);

assert.match(
  stylesSource,
  /\.onboarding-guide-map[\s\S]*\.onboarding-coach[\s\S]*\.onboarding-coach\.key/s,
  "Styles should cover the guide map, base coach, and key coach states.",
);
