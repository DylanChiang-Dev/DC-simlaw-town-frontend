import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const appSource = readFileSync(join(root, "src", "App.tsx"), "utf8");
const dialogSource = readFileSync(
  join(root, "src", "components", "PlayerLawyerInputDialog.tsx"),
  "utf8",
);
const shellSource = readFileSync(
  join(root, "src", "components", "TaskWorkbenchShell.tsx"),
  "utf8",
);
const stylesSource = readFileSync(join(root, "src", "styles.css"), "utf8");

assert.match(
  dialogSource,
  /import \{ TaskWorkbenchShell \} from ["']\.\/TaskWorkbenchShell["'];/,
  "Player lawyer input dialog should use the shared near-fullscreen workbench shell.",
);

assert.match(
  dialogSource,
  /<TaskWorkbenchShell[\s\S]*ariaLabel="当前角色输入"[\s\S]*left=\{[\s\S]*right=\{[\s\S]*footer=\{/,
  "Player lawyer input dialog should pass left/right panes and footer actions into the workbench shell.",
);

assert.doesNotMatch(
  dialogSource,
  /<section className="player-lawyer-input-dialog">/,
  "Player lawyer input dialog should not keep the old small scrolling modal shell.",
);

assert.match(
  shellSource,
  /export function TaskWorkbenchShell/,
  "Shared workbench shell component should exist.",
);

assert.match(
  shellSource,
  /className="task-workbench-shell"/,
  "Shared workbench shell should expose a stable root class.",
);

assert.match(
  shellSource,
  /role="dialog"[\s\S]*aria-modal="true"/,
  "Shared workbench shell should own the modal dialog accessibility wrapper.",
);

assert.match(
  stylesSource,
  /\.task-workbench-shell\s*\{[\s\S]*width:\s*min\(1240px,\s*calc\(100vw - 40px\)\)[\s\S]*height:\s*min\(94vh,\s*900px\)/,
  "Workbench shell should be near-fullscreen on desktop.",
);

assert.match(
  stylesSource,
  /\.task-workbench-body\s*\{[\s\S]*grid-template-columns:\s*minmax\(280px,\s*0\.34fr\)\s+minmax\(0,\s*1fr\)[\s\S]*min-height:\s*0/,
  "Workbench body should use a bounded left assist pane and a large main pane.",
);

assert.match(
  stylesSource,
  /\.task-workbench-footer\s*\{[\s\S]*display:\s*flex[\s\S]*justify-content:\s*flex-end/,
  "Workbench footer actions should be fixed at the bottom of the shell.",
);

assert.doesNotMatch(
  dialogSource,
  /player-lawyer-document-callout|onOpenDocumentWorkbench/,
  "Document-stage tasks should not render the old separate document callout or workbench branch.",
);

assert.match(
  dialogSource,
  /<form[\s\S]*className="player-workbench-form"[\s\S]*onSubmit=\{handleSubmit\}[\s\S]*ref=\{formRef\}[\s\S]*>[\s\S]*参考模板[\s\S]*套用模板[\s\S]*智能体润色[\s\S]*className="player-workbench-editor"[\s\S]*提交文书并继续/s,
  "Document-stage tasks should use the same workbench form with a backend template, large textarea, and submit action.",
);

assert.match(
  dialogSource,
  /document-followup-panel[\s\S]*追问当事人[\s\S]*document-followup-history[\s\S]*followupHistory/,
  "Document-stage tasks should keep follow-up progress and history in the assist pane.",
);

assert.match(
  dialogSource,
  /document-followup-row/,
  "Document-stage tasks should include an independent follow-up question input row.",
);

assert.match(
  dialogSource,
  /value=\{followupQuestion\}/,
  "Document-stage follow-up input should read from the independent follow-up question state.",
);

assert.match(
  dialogSource,
  /onChange=\{\(event\) => setFollowupQuestion\(event\.target\.value\)\}/,
  "Document-stage follow-up input should update the independent follow-up question state.",
);

assert.match(
  dialogSource,
  /const leftPane = \([\s\S]*player-lawyer-context[\s\S]*document-followup-history[\s\S]*\);/,
  "Player workbench left pane should keep context and document follow-up history together.",
);

assert.match(
  dialogSource,
  /const rightPane = \([\s\S]*showDocumentDrafting[\s\S]*player-workbench-editor[\s\S]*document-followup-row[\s\S]*\);/,
  "Player workbench right pane should switch between a large editor and follow-up question input in the same workbench.",
);

assert.doesNotMatch(
  dialogSource,
  /role="tab"|className=".*tab/,
  "Document follow-up and drafting should not be implemented as tabs.",
);

assert.match(
  appSource,
  /async function handleManualDocumentSubmit\([^)]*documentText[^)]*\)/,
  "Document manual submission should accept user-entered document text from the unified task dialog.",
);

assert.match(
  appSource,
  /documentText:\s*input\.documentText/,
  "Document manual submission should pass the dialog text into confirm-manual.",
);

assert.match(
  dialogSource,
  /DOCUMENT_FOLLOWUP_HINTS_BY_STAGE\s*=\s*\{[\s\S]*CD:\s*\[[\s\S]*DD:\s*\[[\s\S]*AD:\s*\[[\s\S]*AR:\s*\[[\s\S]*DOCUMENT_STAGES\s*=\s*new Set\(Object\.keys\(DOCUMENT_FOLLOWUP_HINTS_BY_STAGE\)\)/,
  "The unified document task dialog should cover CD, DD, AD, and AR document stages through the stage-specific hint map.",
);

assert.match(
  dialogSource,
  /try \{[\s\S]*await onSubmitText\(\{[\s\S]*\}\);[\s\S]*\} catch \(err\) \{[\s\S]*setPolishError\(err instanceof Error \? err\.message : ["']提交回复失败["']\);[\s\S]*\}/,
  "Manual text submit failures should stay inside the dialog and show an error instead of closing as if submitted.",
);
