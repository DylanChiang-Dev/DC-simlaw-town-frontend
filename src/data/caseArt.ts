import type { CharacterKey } from './runtimeScene';

export type CaseArtProfile = {
  caseId: string;
  plaintiffKey: CharacterKey;
  defendantKey: CharacterKey;
  plaintiffLawyerKey: CharacterKey;
  defendantLawyerKey: CharacterKey;
  plaintiffPortrait: string;
  defendantPortrait: string;
  plaintiffLawyerPortrait: string;
  defendantLawyerPortrait: string;
  caseCg: string;
};

export type CaseArtAssetMap = Record<string, CaseArtProfile>;

export const DEFAULT_CASE_ART_PROFILE: CaseArtProfile = {
  caseId: 'default',
  plaintiffKey: 'client',
  defendantKey: 'defendant',
  plaintiffLawyerKey: 'playerLawyer',
  defendantLawyerKey: 'opponentLawyer',
  plaintiffPortrait: '/art/vn/char-client-worried.png',
  defendantPortrait: '/art/vn/char-defendant-cheng-yujing-defensive.png',
  plaintiffLawyerPortrait: '/art/vn/char-player-lawyer-neutral.png',
  defendantLawyerPortrait: '/art/vn/char-opponent-lawyer-confident.png',
  caseCg: '/art/vn/bg-case-analysis-room.png',
};

export const CASE_ART_PROFILES: CaseArtAssetMap = {
  case_1: {
    caseId: 'case_1',
    plaintiffKey: 'case1Plaintiff',
    defendantKey: 'case1Defendant',
    plaintiffLawyerKey: 'lawyerZhangMing',
    defendantLawyerKey: 'lawyerWangXiaoming',
    plaintiffPortrait: '/art/vn/char-case1-plaintiff-wu-jian-concerned.png',
    defendantPortrait: '/art/vn/char-case1-defendant-lan-xuanbo-defensive.png',
    plaintiffLawyerPortrait: '/art/vn/char-lawyer-zhang-ming-neutral.png',
    defendantLawyerPortrait: '/art/vn/char-lawyer-wang-xiaoming-neutral.png',
    caseCg: '/art/vn/cg-case1-hair-salon-rent-evidence.png',
  },
  case_3: {
    caseId: 'case_3',
    plaintiffKey: 'case3Plaintiff',
    defendantKey: 'case3Defendant',
    plaintiffLawyerKey: 'lawyerWangXiaoming',
    defendantLawyerKey: 'playerLawyer',
    plaintiffPortrait: '/art/vn/char-case3-plaintiff-lian-jie-firm.png',
    defendantPortrait: '/art/vn/char-case3-defendant-huangfu-chao-guarded.png',
    plaintiffLawyerPortrait: '/art/vn/char-lawyer-wang-xiaoming-neutral.png',
    defendantLawyerPortrait: '/art/vn/char-player-lawyer-neutral.png',
    caseCg: '/art/vn/cg-case3-swimming-pool-loan-evidence.png',
  },
  case_5: {
    caseId: 'case_5',
    plaintiffKey: 'case5Plaintiff',
    defendantKey: 'case5Defendant',
    plaintiffLawyerKey: 'playerLawyer',
    defendantLawyerKey: 'playerLawyer',
    plaintiffPortrait: '/art/vn/char-case5-plaintiff-ma-xinhua-composed.png',
    defendantPortrait: '/art/vn/char-case5-defendant-wei-chenghui-anxious.png',
    plaintiffLawyerPortrait: '/art/vn/char-player-lawyer-neutral.png',
    defendantLawyerPortrait: '/art/vn/char-player-lawyer-neutral.png',
    caseCg: '/art/vn/cg-case5-car-purchase-evidence.png',
  },
  case_6: {
    caseId: 'case_6',
    plaintiffKey: 'case6Plaintiff',
    defendantKey: 'case6Defendant',
    plaintiffLawyerKey: 'opponentLawyer',
    defendantLawyerKey: 'lawyerWangXiaoming',
    plaintiffPortrait: '/art/vn/char-case6-plaintiff-zhang-guoming-firm.png',
    defendantPortrait: '/art/vn/char-case6-defendant-zhang-jingjun-guarded.png',
    plaintiffLawyerPortrait: '/art/vn/char-opponent-lawyer-confident.png',
    defendantLawyerPortrait: '/art/vn/char-lawyer-wang-xiaoming-neutral.png',
    caseCg: '/art/vn/cg-case6-fabric-iou-evidence.png',
  },
  case_7: {
    caseId: 'case_7',
    plaintiffKey: 'case7Plaintiff',
    defendantKey: 'case7Defendant',
    plaintiffLawyerKey: 'playerLawyer',
    defendantLawyerKey: 'opponentLawyer',
    plaintiffPortrait: '/art/vn/char-case7-plaintiff-hu-yindi-worried.png',
    defendantPortrait: '/art/vn/char-case7-defendant-zhou-sigui-anxious.png',
    plaintiffLawyerPortrait: '/art/vn/char-player-lawyer-neutral.png',
    defendantLawyerPortrait: '/art/vn/char-opponent-lawyer-confident.png',
    caseCg: '/art/vn/cg-case7-shanghai-traffic-accident-overview.png',
  },
  case_9: {
    caseId: 'case_9',
    plaintiffKey: 'client',
    defendantKey: 'defendant',
    plaintiffLawyerKey: 'playerLawyer',
    defendantLawyerKey: 'opponentLawyer',
    plaintiffPortrait: '/art/vn/char-plaintiff-liu-yutian-worried.png',
    defendantPortrait: '/art/vn/char-defendant-cheng-yujing-defensive.png',
    plaintiffLawyerPortrait: '/art/vn/char-player-lawyer-neutral.png',
    defendantLawyerPortrait: '/art/vn/char-opponent-lawyer-confident.png',
    caseCg: '/art/vn/cg-case9-traffic-accident-overview.png',
  },
};

export function normalizeCaseArtId(caseId: unknown): string {
  const trimmed = String(caseId || '').trim().toLowerCase();
  if (!trimmed) return '';
  if (/^\d+$/.test(trimmed)) return `case_${trimmed}`;
  if (/^case_\d+$/.test(trimmed)) return trimmed;
  return trimmed;
}

export function getCaseArtProfile(caseId: unknown): CaseArtProfile {
  return CASE_ART_PROFILES[normalizeCaseArtId(caseId)] || DEFAULT_CASE_ART_PROFILE;
}
