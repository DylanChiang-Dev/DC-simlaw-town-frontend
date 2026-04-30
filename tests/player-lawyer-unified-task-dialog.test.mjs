import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const appSource = readFileSync(join(root, 'src', 'App.tsx'), 'utf8');
const dialogSource = readFileSync(join(root, 'src', 'components', 'PlayerLawyerInputDialog.tsx'), 'utf8');

assert.doesNotMatch(
  dialogSource,
  /player-lawyer-document-callout|onOpenDocumentWorkbench/,
  'Document-stage tasks should not render the old separate document callout or workbench branch.',
);

assert.match(
  dialogSource,
  /<form onSubmit=\{handleSubmit\}>[\s\S]*参考模板[\s\S]*套用模板[\s\S]*智能体润色[\s\S]*<textarea[\s\S]*提交文书并继续/s,
  'Document-stage tasks should use the same dialog form with a backend template, textarea, and submit action.',
);

assert.match(
  dialogSource,
  /document-followup-panel[\s\S]*追问当事人[\s\S]*followupQuestion[\s\S]*followupHistory/,
  'Document-stage tasks should include an independent follow-up panel that does not reuse the document textarea.',
);

assert.match(
  appSource,
  /async function handleManualDocumentSubmit\([^)]*documentText[^)]*\)/,
  'Document manual submission should accept user-entered document text from the unified task dialog.',
);

assert.match(
  appSource,
  /documentText:\s*input\.documentText/,
  'Document manual submission should pass the dialog text into confirm-manual.',
);

assert.match(
  dialogSource,
  /DOCUMENT_STAGES\s*=\s*new Set\(\['CD', 'DD', 'AD', 'AR'\]\)/,
  'The unified document task dialog should cover CD, DD, AD, and AR document stages.',
);

assert.match(
  dialogSource,
  /try \{[\s\S]*await onSubmitText\(\{[\s\S]*\}\);[\s\S]*\} catch \(err\) \{[\s\S]*setPolishError\(err instanceof Error \? err\.message : '提交回复失败'\);[\s\S]*\}/,
  'Manual text submit failures should stay inside the dialog and show an error instead of closing as if submitted.',
);
