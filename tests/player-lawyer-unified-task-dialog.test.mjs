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
  /<form onSubmit=\{handleSubmit\}>[\s\S]*<textarea[\s\S]*AI 生成文书并继续流程[\s\S]*提交文书并继续/s,
  'Document-stage tasks should use the same dialog form with textarea, AI generation, and submit actions.',
);

assert.match(
  appSource,
  /async function handleAutoDocumentSubmit\([^)]*playerDraft[^)]*\)/,
  'Document auto-generation should accept user-entered draft content from the unified task dialog.',
);

assert.match(
  appSource,
  /playerDraft:\s*input\.playerDraft/,
  'Document auto-generation should pass the dialog draft text into document-assist.',
);

assert.match(
  dialogSource,
  /DOCUMENT_STAGES\s*=\s*new Set\(\['CD', 'DD', 'AD', 'AR'\]\)/,
  'The unified document task dialog should cover CD, DD, AD, and AR document stages.',
);
