import type { RuntimeTechCatalog } from '../services/types';

export type CharacterKey =
  | 'system'
  | 'playerLawyer'
  | 'client'
  | 'defendant'
  | 'receptionist'
  | 'judge'
  | 'appealJudge'
  | 'opponentLawyer'
  | 'courtClerk'
  | 'judgeAssistant'
  | 'trafficOfficer'
  | 'lawyerLiTing'
  | 'case1Plaintiff'
  | 'case1Defendant'
  | 'case3Plaintiff'
  | 'case3Defendant'
  | 'case5Plaintiff'
  | 'case5Defendant'
  | 'case6Plaintiff'
  | 'case6Defendant'
  | 'case7Plaintiff'
  | 'case7Defendant'
  | 'lawyerZhangMing'
  | 'lawyerWangXiaoming'
  | 'lawyerChenGang';

export type Character = {
  key: CharacterKey;
  name: string;
  role: string;
  portrait: string;
  position: 'left' | 'center' | 'right';
};

export type RuntimeTechUsageCounts = Record<string, number>;

export type DialogueScene = {
  id: string;
  caseTitle: string;
  caseId?: string;
  playerSeat: string;
  stageCode: string;
  stageName: string;
  background: string;
  speaker: CharacterKey;
  speakerLabel?: string;
  text: string;
  characters: CharacterKey[];
  actions: string[];
  tech: {
    agent: string;
    tools: string[];
    skills: string[];
    catalog: RuntimeTechCatalog | null;
    usedTools: RuntimeTechUsageCounts;
    usedSkills: RuntimeTechUsageCounts;
    activeTools: string[];
    activeSkills: string[];
    lastTechEventAt: string;
    memory: string;
    pipeline: string;
  };
};

export type LifecycleStage = {
  code: string;
  title: string;
  status: 'done' | 'active' | 'upcoming';
};

export const characters: Record<CharacterKey, Character> = {
  system: {
    key: 'system',
    name: '系统',
    role: '流程运行与状态提示',
    portrait: '',
    position: 'center',
  },
  playerLawyer: {
    key: 'playerLawyer',
    name: '李婷',
    role: '原告律师',
    portrait: '/art/vn/char-player-lawyer-neutral.png',
    position: 'left',
  },
  client: {
    key: 'client',
    name: '刘玉田',
    role: '原告当事人',
    portrait: '/art/vn/char-client-worried.png',
    position: 'right',
  },
  defendant: {
    key: 'defendant',
    name: '程玉静',
    role: '被告当事人',
    portrait: '/art/vn/char-defendant-cheng-yujing-defensive.png',
    position: 'left',
  },
  receptionist: {
    key: 'receptionist',
    name: '律所前台',
    role: '前台接待与律师推荐',
    portrait: '/art/vn/char-receptionist-warm.png',
    position: 'right',
  },
  judge: {
    key: 'judge',
    name: '刘正',
    role: '一审法官',
    portrait: '/art/vn/char-judge-serious.png',
    position: 'center',
  },
  appealJudge: {
    key: 'appealJudge',
    name: '海瑞',
    role: '二审法官',
    portrait: '/art/vn/char-appeal-judge-neutral.png',
    position: 'center',
  },
  opponentLawyer: {
    key: 'opponentLawyer',
    name: '赵雪',
    role: '被告律师',
    portrait: '/art/vn/char-opponent-lawyer-confident.png',
    position: 'right',
  },
  lawyerLiTing: {
    key: 'lawyerLiTing',
    name: '李婷',
    role: '被告律师',
    portrait: '/art/vn/char-player-lawyer-neutral.png',
    position: 'right',
  },
  courtClerk: {
    key: 'courtClerk',
    name: '书记员',
    role: '庭审程序辅助',
    portrait: '/art/vn/char-court-clerk-neutral.png',
    position: 'center',
  },
  judgeAssistant: {
    key: 'judgeAssistant',
    name: '法官助理',
    role: '法院文书与流程辅助',
    portrait: '/art/vn/char-judge-assistant-checking.png',
    position: 'center',
  },
  trafficOfficer: {
    key: 'trafficOfficer',
    name: '事故认定人员',
    role: '交通事故证据来源',
    portrait: '/art/vn/char-traffic-officer-neutral.png',
    position: 'center',
  },
  case1Plaintiff: {
    key: 'case1Plaintiff',
    name: '吴建',
    role: '原告当事人',
    portrait: '/art/vn/char-case1-plaintiff-wu-jian-concerned.png',
    position: 'right',
  },
  case1Defendant: {
    key: 'case1Defendant',
    name: '蓝宣博',
    role: '被告当事人',
    portrait: '/art/vn/char-case1-defendant-lan-xuanbo-defensive.png',
    position: 'left',
  },
  case3Plaintiff: {
    key: 'case3Plaintiff',
    name: '连杰',
    role: '原告当事人',
    portrait: '/art/vn/char-case3-plaintiff-lian-jie-firm.png',
    position: 'right',
  },
  case3Defendant: {
    key: 'case3Defendant',
    name: '皇甫超',
    role: '被告当事人',
    portrait: '/art/vn/char-case3-defendant-huangfu-chao-guarded.png',
    position: 'left',
  },
  case5Plaintiff: {
    key: 'case5Plaintiff',
    name: '马新华',
    role: '原告当事人',
    portrait: '/art/vn/char-case5-plaintiff-ma-xinhua-composed.png',
    position: 'right',
  },
  case5Defendant: {
    key: 'case5Defendant',
    name: '魏承辉',
    role: '被告当事人',
    portrait: '/art/vn/char-case5-defendant-wei-chenghui-anxious.png',
    position: 'left',
  },
  case6Plaintiff: {
    key: 'case6Plaintiff',
    name: '张国明',
    role: '原告当事人',
    portrait: '/art/vn/char-case6-plaintiff-zhang-guoming-firm.png',
    position: 'right',
  },
  case6Defendant: {
    key: 'case6Defendant',
    name: '张晶俊',
    role: '被告当事人',
    portrait: '/art/vn/char-case6-defendant-zhang-jingjun-guarded.png',
    position: 'left',
  },
  case7Plaintiff: {
    key: 'case7Plaintiff',
    name: '胡引弟',
    role: '原告当事人',
    portrait: '/art/vn/char-case7-plaintiff-hu-yindi-worried.png',
    position: 'right',
  },
  case7Defendant: {
    key: 'case7Defendant',
    name: '周思贵',
    role: '被告当事人',
    portrait: '/art/vn/char-case7-defendant-zhou-sigui-anxious.png',
    position: 'left',
  },
  lawyerZhangMing: {
    key: 'lawyerZhangMing',
    name: '张明',
    role: '金杜律师 / 民商事律师',
    portrait: '/art/vn/char-lawyer-zhang-ming-neutral.png',
    position: 'left',
  },
  lawyerWangXiaoming: {
    key: 'lawyerWangXiaoming',
    name: '王小明',
    role: '金杜律师 / 民商事律师',
    portrait: '/art/vn/char-lawyer-wang-xiaoming-neutral.png',
    position: 'left',
  },
  lawyerChenGang: {
    key: 'lawyerChenGang',
    name: '陈刚',
    role: '金杜律师 / 刑事辩护律师',
    portrait: '/art/vn/char-lawyer-chen-gang-serious.png',
    position: 'left',
  },
};

export const lifecycleStages: LifecycleStage[] = [
  { code: 'PLC', title: '原告咨询', status: 'done' },
  { code: 'CD', title: '起诉状起草', status: 'active' },
  { code: 'DLC', title: '被告咨询', status: 'upcoming' },
  { code: 'DD', title: '答辩状起草', status: 'upcoming' },
  { code: 'CI', title: '一审庭审', status: 'upcoming' },
  { code: 'AD', title: '上诉状起草', status: 'upcoming' },
  { code: 'AR', title: '上诉答辩状起草', status: 'upcoming' },
  { code: 'CIA', title: '二审庭审', status: 'upcoming' },
];
