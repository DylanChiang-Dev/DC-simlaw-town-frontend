import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const runtimeSceneSource = readFileSync(join(root, 'src', 'data', 'runtimeScene.ts'), 'utf8');
const reducerSource = readFileSync(join(root, 'src', 'state', 'vnEventReducer.ts'), 'utf8');
const stageSource = readFileSync(join(root, 'src', 'components', 'VisualNovelStage.tsx'), 'utf8');
const styleSource = readFileSync(join(root, 'src', 'styles.css'), 'utf8');

[
  'char-defendant-cheng-yujing-defensive.png',
  'char-appeal-judge-neutral.png',
  'char-court-clerk-neutral.png',
  'char-judge-assistant-checking.png',
  'char-traffic-officer-neutral.png',
].forEach((asset) => {
  assert.match(
    runtimeSceneSource,
    new RegExp(asset.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
    `${asset} should be embedded in the runtime character map.`,
  );
});

[
  'char-case1-plaintiff-wu-jian-concerned.png',
  'char-case1-defendant-lan-xuanbo-defensive.png',
  'char-case3-plaintiff-lian-jie-firm.png',
  'char-case3-defendant-huangfu-chao-guarded.png',
  'char-case5-plaintiff-ma-xinhua-composed.png',
  'char-case5-defendant-wei-chenghui-anxious.png',
  'char-case6-plaintiff-zhang-guoming-firm.png',
  'char-case6-defendant-zhang-jingjun-guarded.png',
  'char-case7-plaintiff-hu-yindi-worried.png',
  'char-case7-defendant-zhou-sigui-anxious.png',
  'char-lawyer-zhang-ming-neutral.png',
  'char-player-lawyer-neutral.png',
  'char-lawyer-wang-xiaoming-neutral.png',
  'char-lawyer-chen-gang-serious.png',
].forEach((asset) => {
  assert.match(
    runtimeSceneSource,
    new RegExp(asset.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
    `${asset} should be embedded in the runtime character map.`,
  );
});

[
  ['吴建', 'case1Plaintiff'],
  ['蓝宣博', 'case1Defendant'],
  ['连杰', 'case3Plaintiff'],
  ['皇甫超', 'case3Defendant'],
  ['马新华', 'case5Plaintiff'],
  ['魏承辉', 'case5Defendant'],
  ['张国明', 'case6Plaintiff'],
  ['张晶俊', 'case6Defendant'],
  ['胡引弟', 'case7Plaintiff'],
  ['周思贵', 'case7Defendant'],
  ['张明', 'lawyerZhangMing'],
  ['李婷', 'lawyerLiTing'],
  ['王小明', 'lawyerWangXiaoming'],
  ['陈刚', 'lawyerChenGang'],
].forEach(([speakerName, characterKey]) => {
  assert.match(
    reducerSource,
    new RegExp(`speakerName\\.includes\\('${speakerName}'\\)[\\s\\S]*return '${characterKey}'`),
    `${speakerName} dialogue should resolve to ${characterKey}.`,
  );
});

assert.match(
  reducerSource,
  /const caseArt = getCaseArtProfile\(payload\.case_id \|\| payload\.caseId \|\| ''\);[\s\S]*return caseArt\.defendantKey;[\s\S]*return caseArt\.plaintiffKey;/,
  'VN reducer should use case_id as a fallback for case-specific plaintiff and defendant portraits.',
);

assert.match(
  reducerSource,
  /value\.includes\('defendant'\)[\s\S]*return caseArt\.defendantKey;/,
  'Defendant speaker payloads should use the case defendant portrait, not the defendant lawyer portrait.',
);

assert.match(
  reducerSource,
  /value\.includes\('appeal'\)[\s\S]*return 'appealJudge';/,
  'Appeal judge payloads should use the generated second-instance judge portrait.',
);

assert.match(
  reducerSource,
  /value\.includes\('plaintiff_lawyer'\)[\s\S]*return caseArt\.plaintiffLawyerKey;[\s\S]*value\.includes\('plaintiff'\)[\s\S]*return caseArt\.plaintiffKey;/,
  'Plaintiff lawyer speaker ids should resolve to the case plaintiff lawyer before generic plaintiff/client matching.',
);

assert.match(
  reducerSource,
  /value\.includes\('defendant_lawyer'\)[\s\S]*return caseArt\.defendantLawyerKey;[\s\S]*value\.includes\('defendant'\)[\s\S]*return caseArt\.defendantKey;/,
  'Defendant lawyer speaker ids should resolve to the case defendant lawyer before generic defendant/client matching.',
);

assert.match(
  runtimeSceneSource,
  /lawyerLiTing:\s*\{[\s\S]*name:\s*'李婷'[\s\S]*role:\s*'被告律师'/,
  'Li Ting needs a non-player courtroom role so defendant-side case_1 speech is not labeled as the plaintiff player lawyer.',
);

assert.match(
  readFileSync(join(root, 'src', 'data', 'caseArt.ts'), 'utf8'),
  /case_1:\s*\{[\s\S]*plaintiffLawyerKey:\s*'lawyerZhangMing'[\s\S]*defendantLawyerKey:\s*'lawyerWangXiaoming'/,
  'case_1 should render Zhang Ming as plaintiff lawyer and Wang Xiaoming as defendant lawyer.',
);

assert.match(
  reducerSource,
  /value\.includes\('lawyer_b01'\) && speakerName\.includes\('李婷'\)[\s\S]*return 'lawyerLiTing'/,
  'Historical backend records naming lawyer_B01/李婷 should still render Li Ting instead of the case default lawyer.',
);

assert.match(
  reducerSource,
  /readPlayerResponsibility\(payload\.player_responsibility\)[\s\S]*return caseArt\.plaintiffLawyerKey;[\s\S]*value\.includes\('lawyer_b02'\) && speakerName\.includes\('赵雪'\)[\s\S]*return 'opponentLawyer'/,
  'Player-responsibility dialogue should resolve to the current plaintiff lawyer before legacy Zhao Xue/opponent-lawyer fallbacks.',
);

assert.match(
  reducerSource,
  /speakerName\.includes\('李婷'\)[\s\S]*caseArt\.plaintiffLawyerKey === 'playerLawyer'[\s\S]*return 'playerLawyer'[\s\S]*defendant_lawyer[\s\S]*return 'lawyerLiTing'/,
  'The Chinese name 李婷 should follow the current case-side mapping instead of always forcing the player-lawyer portrait.',
);

assert.match(
  reducerSource,
  /const speakerName = String\(payload\.speaker_name \|\| ''\)[\s\S]*speakerName\.includes\('刘正'\)[\s\S]*return 'judge'/,
  'First-instance judge dialogue with only the Chinese speaker name 刘正 should render as the judge, not the player lawyer.',
);

assert.match(
  reducerSource,
  /speakerName\.includes\('海瑞'\)[\s\S]*return 'appealJudge'/,
  'Second-instance judge dialogue with only the Chinese speaker name 海瑞 should render as the appeal judge.',
);

assert.doesNotMatch(
  reducerSource,
  /function inferStageCodeForDialogue[\s\S]*speaker === 'judge'[\s\S]*return 'CI'/,
  'Character identity should not force the first-instance courtroom scene; backgrounds must come from stage codes.',
);

assert.doesNotMatch(
  reducerSource,
  /function inferStageCodeForDialogue[\s\S]*speaker === 'appealJudge'[\s\S]*return 'CIA'/,
  'Character identity should not force the second-instance courtroom scene; backgrounds must come from stage codes.',
);

assert.match(
  reducerSource,
  /function inferStageCodeForDialogue\([\s\S]*explicitStage: unknown,[\s\S]*fallbackStageCode: string,[\s\S]*\): string \{[\s\S]*if \(explicit\) return normalizeStageCode\(explicit\);[\s\S]*return fallbackStageCode;[\s\S]*\}/,
  'Dialogue stage inference should prefer explicit stage codes and otherwise keep the current stage instead of deriving scenes from speakers.',
);

assert.doesNotMatch(
  reducerSource,
  /function isFirstInstanceCourtProcedureText\(text: string\): boolean/,
  'Court procedure text should not decide the VN background; backend stage codes own the scene.',
);

assert.doesNotMatch(
  reducerSource,
  /function isSecondInstanceCourtProcedureText\(text: string\): boolean/,
  'Second-instance court procedure text should not decide the VN background; backend stage codes own the scene.',
);

assert.doesNotMatch(
  reducerSource,
  /\|\|\s*\/[^/\n]*法庭[^/\n]*\/\.test\(text\)/,
  'Lawyer consultation that merely mentions 法庭 must not be promoted to the courtroom scene.',
);

assert.match(
  reducerSource,
  /function inferCharacters\(stageCode: string, speaker: CharacterKey\): CharacterKey\[\] \{\s*return \[speaker\];\s*\}/,
  'Dialogue scenes should expose only the current speaker as the visible character.',
);

assert.match(
  stageSource,
  /const visibleCharacters = getVisibleCharacters\(scene\);/,
  'VisualNovelStage should derive a defensive single-speaker render list.',
);

assert.match(
  stageSource,
  /function getVisibleCharacters\(scene: DialogueScene\)[\s\S]*return \[scene\.speaker\];/,
  'The visual layer should render only the active speaker even if scene.characters contains extra roles.',
);

assert.match(
  styleSource,
  /height:\s*var\(--vn-character-height\);[\s\S]*width:\s*auto;/,
  'Character portraits should be normalized by height, not by canvas width.',
);

assert.doesNotMatch(
  styleSource,
  /portrait-layer\.count-[23]\s+\.character-portrait/,
  'Multi-character count rules should not resize portraits differently.',
);
