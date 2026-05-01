import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const caseArtPath = join(root, 'src', 'data', 'caseArt.ts');

assert.ok(existsSync(caseArtPath), 'Case art mapping should live in src/data/caseArt.ts.');

const caseArtSource = readFileSync(caseArtPath, 'utf8');
const artRoot = join(root, 'public');

[
  ['case_1', 'char-case1-plaintiff-wu-jian-concerned.png', 'char-case1-defendant-lan-xuanbo-defensive.png', 'cg-case1-hair-salon-rent-evidence.png'],
  ['case_3', 'char-case3-plaintiff-lian-jie-firm.png', 'char-case3-defendant-huangfu-chao-guarded.png', 'cg-case3-swimming-pool-loan-evidence.png'],
  ['case_5', 'char-case5-plaintiff-ma-xinhua-composed.png', 'char-case5-defendant-wei-chenghui-anxious.png', 'cg-case5-car-purchase-evidence.png'],
  ['case_6', 'char-case6-plaintiff-zhang-guoming-firm.png', 'char-case6-defendant-zhang-jingjun-guarded.png', 'cg-case6-fabric-iou-evidence.png'],
  ['case_7', 'char-case7-plaintiff-hu-yindi-worried.png', 'char-case7-defendant-zhou-sigui-anxious.png', 'cg-case7-shanghai-traffic-accident-overview.png'],
  ['case_9', 'char-plaintiff-liu-yutian-worried.png', 'char-defendant-cheng-yujing-defensive.png', 'cg-case9-traffic-accident-overview.png'],
].forEach(([caseId, plaintiff, defendant, cg]) => {
  assert.match(caseArtSource, new RegExp(`${caseId}:\\s*\\{`), `${caseId} should be configured in the case art map.`);
  [plaintiff, defendant, cg].forEach((asset) => {
    assert.match(caseArtSource, new RegExp(asset.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `${caseId} should map ${asset}.`);
    assert.ok(existsSync(join(artRoot, 'art', 'vn', asset)), `${asset} should exist in public art assets.`);
  });
});

assert.match(
  caseArtSource,
  /export function normalizeCaseArtId\(caseId: unknown\): string[\s\S]*case_\$\{trimmed\}/,
  'Case art ids should normalize numeric ids such as 1 into case_1.',
);

assert.match(
  caseArtSource,
  /export function getCaseArtProfile\(caseId: unknown\): CaseArtProfile[\s\S]*DEFAULT_CASE_ART_PROFILE/,
  'Case art lookup should return a fallback profile for unknown case ids.',
);

assert.match(
  caseArtSource,
  /case_1:[\s\S]*plaintiffLawyerKey:\s*'lawyerZhangMing'[\s\S]*case_3:[\s\S]*plaintiffLawyerKey:\s*'lawyerWangXiaoming'[\s\S]*case_6:[\s\S]*defendantLawyerKey:\s*'lawyerWangXiaoming'/,
  'Case art profiles should map the known assigned lawyers for the multi-case docket.',
);
