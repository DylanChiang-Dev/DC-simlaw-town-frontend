import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const dialogSource = readFileSync(
  join(root, "src", "components", "PlayerLawyerInputDialog.tsx"),
  "utf8",
);
const runtimeSource = readFileSync(
  join(root, "src", "state", "usePlayerLawyerRuntime.ts"),
  "utf8",
);
const apiSource = readFileSync(
  join(root, "src", "services", "playerLawyerApi.ts"),
  "utf8",
);
const appSource = readFileSync(join(root, "src", "App.tsx"), "utf8");
const followupHintsBlock =
  dialogSource.match(
    /const DOCUMENT_FOLLOWUP_HINTS_BY_STAGE = \{[\s\S]*?\n\};/,
  )?.[0] || "";

assert.doesNotMatch(
  dialogSource,
  /AI 代答并提交|handleAutoDraftSubmit/,
  "Formal player text input should not expose one-click AI answer submission.",
);

assert.doesNotMatch(
  runtimeSource,
  /draftTextReply/,
  "Formal player runtime should not expose one-click AI answer submission.",
);

assert.doesNotMatch(
  appSource,
  /onDraftText/,
  "App should not pass a one-click AI draft submit handler into the player dialog.",
);

assert.doesNotMatch(
  apiSource,
  /draftPlayerLawyerResponse/,
  "Formal frontend API wrapper should not expose draft-response after removing the UI entry.",
);

assert.match(
  dialogSource,
  /AI 润色/,
  "The text input dialog should still expose AI polish for user-authored text.",
);

assert.doesNotMatch(
  dialogSource,
  /AI 生成文书并继续流程|handleAutoDocumentSubmit/,
  "The document-stage dialog should no longer expose AI document completion.",
);

assert.match(
  dialogSource,
  /参考模板[\s\S]*套用模板[\s\S]*提交文书并继续/,
  "The document-stage dialog should show a backend template and keep manual document submission.",
);

assert.match(
  dialogSource,
  /onPolishDocument[\s\S]*handleDocumentPolish[\s\S]*智能体润色/,
  "The document-stage dialog should expose intelligent document polish that fills the editor without submitting.",
);

assert.match(
  dialogSource,
  /followupQuestion[\s\S]*handleDocumentFollowup[\s\S]*追问当事人/,
  "The document-stage dialog should expose an independent client follow-up question flow.",
);

assert.match(
  apiSource,
  /sendPlayerLawyerDocumentFollowup[\s\S]*?\/api\/sandbox\/player-lawyer\/document-followup/,
  "Frontend API should call the dedicated document-followup endpoint for document-stage questions.",
);

assert.match(
  dialogSource,
  /const MIN_DOCUMENT_FOLLOWUPS_BEFORE_DRAFTING = 2;/,
  "The document-stage dialog should require two follow-ups before drafting.",
);

assert.match(
  dialogSource,
  /type DocumentMode = ["']followup["'] \| ["']drafting["'];/,
  "The document-stage dialog should model follow-up and drafting as explicit modes.",
);

assert.match(
  dialogSource,
  /const canStartDocumentDraft =\s*followupHistory\.length >= MIN_DOCUMENT_FOLLOWUPS_BEFORE_DRAFTING;/,
  "The document-stage dialog should unlock drafting only after the required follow-up count.",
);

assert.match(
  dialogSource,
  /initialFollowupHistory[\s\S]*setFollowupHistory\(initialFollowupHistory\);/,
  "New document requests should initialize follow-up history from the parent request-scoped state.",
);

assert.match(
  dialogSource,
  /documentStage && documentMode === ["']followup["'][\s\S]*提交追问/,
  "Document requests should initially show a follow-up-only workflow.",
);

assert.match(
  dialogSource,
  /canStartDocumentDraft[\s\S]*开始起草/,
  "The dialog should show a start-drafting action only after enough follow-ups.",
);

assert.match(
  dialogSource,
  /DOCUMENT_FOLLOWUP_HINTS_BY_STAGE[\s\S]*CD:[\s\S]*关键事实[\s\S]*请求依据[\s\S]*DD:[\s\S]*答辩事实[\s\S]*AD:[\s\S]*一审错误[\s\S]*AR:[\s\S]*上诉理由/,
  "The document-stage dialog should expose stage-specific follow-up reference hints.",
);

assert.match(
  followupHintsBlock,
  /example:/,
  "Follow-up hints should include read-only example questions so players know how to ask.",
);

assert.match(
  dialogSource,
  /参考追问方向/,
  "The document-stage dialog should label follow-up hints as reference directions.",
);

assert.match(
  dialogSource,
  /请求依据[\s\S]*每项请求分别依据/,
  "The document-stage dialog should show a cross-case request-basis example question.",
);

assert.match(
  followupHintsBlock,
  /AR:[\s\S]*对方上诉主要不服一审判决的哪几项[\s\S]*一审判决支持我方立场的关键事实和证据是什么[\s\S]*对方每一项上诉理由，你认为哪里不成立[\s\S]*我方是请求驳回上诉、维持原判，还是接受部分调整/,
  "Appeal-response drafting should show follow-up examples focused on answering the appellant and defending the first-instance judgment.",
);

assert.match(
  dialogSource,
  /const documentFollowupHints =\s*DOCUMENT_FOLLOWUP_HINTS_BY_STAGE\[stage\] \|\|\s*DOCUMENT_FOLLOWUP_HINTS_BY_STAGE\.CD;/,
  "The dialog should select follow-up hints by document stage with a stable CD fallback.",
);

assert.doesNotMatch(
  followupHintsBlock,
  /交通事故|借款|借条|转账|收据|医疗费|误工费/,
  "Follow-up hint examples should not be tied to one case type or compensation scenario.",
);

assert.doesNotMatch(
  dialogSource,
  /applyDocumentFollowupHint/,
  "Follow-up hints should not keep helper functions that fill the editable question field.",
);

assert.doesNotMatch(
  followupHintsBlock,
  /setFollowupQuestion/,
  "Follow-up hint data should never be wired to fill the editable question field.",
);

assert.doesNotMatch(
  dialogSource.match(
    /<div className="document-followup-hints"[\s\S]*?<\/div>\s*<div className="document-followup-row">/,
  )?.[0] || "",
  /onClick/,
  "Follow-up hint reference cards should not have click handlers.",
);

assert.match(
  dialogSource,
  /尚未追问。可参考上方问法/,
  "The document-stage dialog should show an empty state before the first follow-up.",
);

assert.match(
  dialogSource,
  /第 \{index \+ 1\} 问：/,
  "The follow-up history should label previous questions by sequence number.",
);

assert.doesNotMatch(
  dialogSource,
  /documentStage \? '请写入完整文书正文，或先套用参考模板后修改。' :/,
  "The document editor should not be rendered unconditionally as soon as a document request opens.",
);

assert.match(
  appSource,
  /handleDocumentFollowup[\s\S]*sendPlayerLawyerDocumentFollowup[\s\S]*requestId:\s*request\.requestId/,
  "App should send document follow-up questions against the active pending document request.",
);

assert.match(
  appSource,
  /documentFollowupHistoryByRequestId[\s\S]*setDocumentFollowupHistoryByRequestId[\s\S]*request\.requestId/,
  "App should keep document follow-up history keyed by request id so reopening the dialog preserves prior questions.",
);

assert.match(
  appSource,
  /initialFollowupHistory=\{activePlayerRequest \? documentFollowupHistoryByRequestId\[activePlayerRequest\.requestId\] \|\| \[\] : \[\]\}/,
  "App should pass request-scoped document follow-up history into the dialog.",
);

assert.match(
  appSource,
  /createPlayerLawyerDocumentDraft[\s\S]*playerDraft:\s*input\.documentText/,
  "App should pass the current document editor text as the draft to document-assist.",
);

assert.match(
  appSource,
  /createPlayerLawyerDocumentDraft[\s\S]*只润色当前草稿，不新增无来源事实/,
  "App should reuse document-assist with a no-fabrication prompt for document polish.",
);

assert.match(
  apiSource,
  /confirmManualPlayerLawyerDocument[\s\S]*?\/api\/sandbox\/player-lawyer\/documents\/confirm-manual/,
  "Frontend API should call the manual document confirmation endpoint for user-authored documents.",
);

assert.match(
  appSource,
  /async function handleManualDocumentSubmit[\s\S]*confirmManualPlayerLawyerDocument/,
  "App should submit document-stage text through the manual confirmation flow.",
);
