import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const dialogSource = readFileSync(join(root, 'src', 'components', 'PlayerLawyerInputDialog.tsx'), 'utf8');
const runtimeSource = readFileSync(join(root, 'src', 'state', 'usePlayerLawyerRuntime.ts'), 'utf8');
const apiSource = readFileSync(join(root, 'src', 'services', 'playerLawyerApi.ts'), 'utf8');
const appSource = readFileSync(join(root, 'src', 'App.tsx'), 'utf8');

assert.doesNotMatch(
  dialogSource,
  /AI 代答并提交|handleAutoDraftSubmit/,
  'Formal player text input should not expose one-click AI answer submission.',
);

assert.doesNotMatch(
  runtimeSource,
  /draftTextReply/,
  'Formal player runtime should not expose one-click AI answer submission.',
);

assert.doesNotMatch(
  appSource,
  /onDraftText/,
  'App should not pass a one-click AI draft submit handler into the player dialog.',
);

assert.doesNotMatch(
  apiSource,
  /draftPlayerLawyerResponse/,
  'Formal frontend API wrapper should not expose draft-response after removing the UI entry.',
);

assert.match(
  dialogSource,
  /AI 润色/,
  'The text input dialog should still expose AI polish for user-authored text.',
);

assert.doesNotMatch(
  dialogSource,
  /AI 生成文书并继续流程|handleAutoDocumentSubmit/,
  'The document-stage dialog should no longer expose AI document completion.',
);

assert.match(
  dialogSource,
  /参考模板[\s\S]*套用模板[\s\S]*提交文书并继续/,
  'The document-stage dialog should show a backend template and keep manual document submission.',
);

assert.match(
  dialogSource,
  /onPolishDocument[\s\S]*handleDocumentPolish[\s\S]*智能体润色/,
  'The document-stage dialog should expose intelligent document polish that fills the editor without submitting.',
);

assert.match(
  dialogSource,
  /followupQuestion[\s\S]*handleDocumentFollowup[\s\S]*追问当事人/,
  'The document-stage dialog should expose an independent client follow-up question flow.',
);

assert.match(
  apiSource,
  /sendPlayerLawyerDocumentFollowup[\s\S]*?\/api\/sandbox\/player-lawyer\/document-followup/,
  'Frontend API should call the dedicated document-followup endpoint for document-stage questions.',
);

assert.match(
  appSource,
  /handleDocumentFollowup[\s\S]*sendPlayerLawyerDocumentFollowup[\s\S]*requestId:\s*request\.requestId/,
  'App should send document follow-up questions against the active pending document request.',
);

assert.match(
  appSource,
  /createPlayerLawyerDocumentDraft[\s\S]*playerDraft:\s*input\.documentText/,
  'App should pass the current document editor text as the draft to document-assist.',
);

assert.match(
  appSource,
  /createPlayerLawyerDocumentDraft[\s\S]*只润色当前草稿，不新增无来源事实/,
  'App should reuse document-assist with a no-fabrication prompt for document polish.',
);

assert.match(
  apiSource,
  /confirmManualPlayerLawyerDocument[\s\S]*?\/api\/sandbox\/player-lawyer\/documents\/confirm-manual/,
  'Frontend API should call the manual document confirmation endpoint for user-authored documents.',
);

assert.match(
  appSource,
  /async function handleManualDocumentSubmit[\s\S]*confirmManualPlayerLawyerDocument/,
  'App should submit document-stage text through the manual confirmation flow.',
);
