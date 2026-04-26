import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const dialogSource = readFileSync(join(root, 'src', 'components', 'PlayerLawyerInputDialog.tsx'), 'utf8');
const runtimeSource = readFileSync(join(root, 'src', 'state', 'usePlayerLawyerRuntime.ts'), 'utf8');
const apiSource = readFileSync(join(root, 'src', 'services', 'playerLawyerApi.ts'), 'utf8');

assert.match(
  apiSource,
  /draftPlayerLawyerResponse[\s\S]*?\/api\/sandbox\/player-lawyer\/draft-response/,
  'Frontend API should call the dedicated AI draft-response endpoint instead of abusing polish-response.',
);

assert.match(
  runtimeSource,
  /draftTextReply:\s*\(input:\s*Omit<PlayerLawyerDraftInput,\s*'requestId'>\)/,
  'usePlayerLawyerRuntime should expose draftTextReply for one-click AI answer generation.',
);

assert.match(
  dialogSource,
  /AI 代答并提交/,
  'The text input dialog should expose an AI auto-answer submit button for flow-through testing.',
);

assert.match(
  dialogSource,
  /AI 生成文书并继续流程/,
  'The document-stage dialog should expose a one-click AI document completion button for flow-through testing.',
);

assert.match(
  dialogSource,
  /handleAutoDraftSubmit/,
  'The AI auto-answer button should submit the generated draft, not only fill an unused local variable.',
);

assert.match(
  dialogSource,
  /handleAutoDocumentSubmit/,
  'The document auto-completion button should invoke the document generation and confirmation flow.',
);
