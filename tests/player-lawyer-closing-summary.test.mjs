import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const appSource = readFileSync(join(root, 'src', 'App.tsx'), 'utf8');
const commandHudSource = readFileSync(join(root, 'src', 'components', 'CommandHud.tsx'), 'utf8');
const dialogueSource = readFileSync(join(root, 'src', 'components', 'DialogueBox.tsx'), 'utf8');
const summarySource = readFileSync(join(root, 'src', 'components', 'CaseClosingSummaryDialog.tsx'), 'utf8');
const apiSource = readFileSync(join(root, 'src', 'services', 'caseClosingApi.ts'), 'utf8');
const typesSource = readFileSync(join(root, 'src', 'services', 'types.ts'), 'utf8');

assert.match(
  dialogueSource,
  /caseClosed\?: boolean/,
  'DialogueBox should accept a terminal caseClosed flag.',
);

assert.match(
  dialogueSource,
  /if \(caseClosed\) \{[\s\S]*message: ''[\s\S]*title: '案件已结案'[\s\S]*blocking: false[\s\S]*\}/,
  'A closed case should not fall through to the running empty-queue Agent generation notice.',
);

assert.match(
  appSource,
  /const caseClosed = isCaseClosed\(vnRuntime\.history, runtime\.simulation\);/,
  'App should derive a terminal closed state from story history and runtime status.',
);

assert.match(
  appSource,
  /caseClosed=\{caseClosed\}/,
  'App should pass the terminal closed state into DialogueBox.',
);

assert.match(
  appSource,
  /function shouldOpenClosingSummary\([\s\S]*acknowledgedEntry: DialogueHistoryEntry \| null[\s\S]*caseClosed: boolean[\s\S]*\): boolean \{[\s\S]*return Boolean\(caseClosed[\s\S]*acknowledgedEntry[\s\S]*isCaseClosedEntry\(acknowledgedEntry\)[\s\S]*\);[\s\S]*\}/,
  'The closing summary should wait until the final CASE_CLOSED story entry has been acknowledged.',
);

assert.match(
  appSource,
  /<CaseClosingSummaryDialog[\s\S]*open=\{closingSummaryOpen\}[\s\S]*caseId=\{closingCaseId\}/,
  'App should render the closing summary dialog only after the final line is acknowledged.',
);

assert.match(
  commandHudSource,
  /canOpenClosingSummary\?: boolean/,
  'CommandHud should accept a flag for the closing score reopen entry.',
);

assert.match(
  commandHudSource,
  /onOpenClosingSummary\?: \(\) => void/,
  'CommandHud should accept a callback for reopening the closing score dialog.',
);

assert.match(
  commandHudSource,
  /canOpenClosingSummary && onOpenClosingSummary[\s\S]*查看评分/,
  'CommandHud should render a 查看评分 button only when the closed-case score can be reopened.',
);

assert.match(
  appSource,
  /const closingCaseId = runtime\.selectedCaseId \|\| runtime\.activeCaseId;/,
  'App should derive one stable case id for automatic and manual closing summary opens.',
);

assert.match(
  appSource,
  /canOpenClosingSummary=\{Boolean\(caseClosed && closingCaseId\)\}/,
  'App should expose the score reopen action only after a case is closed and a case id is known.',
);

assert.match(
  appSource,
  /onOpenClosingSummary=\{\(\) => setClosingSummaryOpen\(true\)\}/,
  'App should let CommandHud reopen the existing closing summary dialog.',
);

assert.match(
  appSource,
  /<CaseClosingSummaryDialog[\s\S]*caseId=\{closingCaseId\}/,
  'The closing summary dialog should use the same stable case id as the HUD reopen action.',
);

assert.match(
  summarySource,
  /fetchCaseClosingSummary[\s\S]*generateCaseClosingEvaluation/,
  'Closing dialog should load the summary first and request AI evaluation asynchronously.',
);

assert.match(
  summarySource,
  /评价生成失败[\s\S]*重新生成评价/,
  'Closing dialog should keep the summary visible and offer a retry when AI evaluation fails.',
);

assert.match(
  summarySource,
  /事实把握[\s\S]*法律论证[\s\S]*程序\/任务完成[\s\S]*表达与职业沟通/,
  'Closing dialog should render the four player-performance evaluation dimensions.',
);

assert.match(
  apiSource,
  /\/api\/sandbox\/cases\/\$\{encodeURIComponent\(normalizedCaseId\)\}\/closing-summary/,
  'Frontend API should fetch the closing summary endpoint.',
);

assert.match(
  apiSource,
  /\/api\/sandbox\/cases\/\$\{encodeURIComponent\(normalizedCaseId\)\}\/closing-evaluation/,
  'Frontend API should post to the closing evaluation endpoint.',
);

assert.match(
  apiSource,
  /\/api\/sandbox\/cases\/\$\{encodeURIComponent\(normalizedCaseId\)\}\/player-run-report\.md/,
  'Frontend API should request the player run Markdown report endpoint.',
);

assert.match(
  summarySource,
  /导出复盘 Markdown/,
  'Closing summary dialog should expose a Markdown review report export action.',
);

assert.match(
  summarySource,
  /downloadPlayerRunReportMarkdown/,
  'Closing summary dialog should call the Markdown report download helper.',
);

assert.doesNotMatch(
  summarySource,
  /summary\.playerTurns\.slice\(-4\)/,
  'Closing summary dialog must not show a partial tail of player submissions.',
);

assert.doesNotMatch(
  summarySource,
  /className="closing-turn-list"/,
  'Closing summary dialog should avoid partial submission lists; full records belong in the Markdown report.',
);

assert.match(
  summarySource,
  /完整提交与对话请导出复盘 Markdown 查看/,
  'Closing summary dialog should tell users where to inspect the full player record.',
);

assert.match(
  typesSource,
  /export type CaseClosingEvaluation/,
  'Frontend types should include the closing evaluation payload.',
);
