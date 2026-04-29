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
  | 'trafficOfficer';

export type Character = {
  key: CharacterKey;
  name: string;
  role: string;
  portrait: string;
  position: 'left' | 'center' | 'right';
};

export type DialogueScene = {
  id: string;
  caseTitle: string;
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
    role: '原告律师 / 玩家代理人',
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
    role: '一审法官 Agent',
    portrait: '/art/vn/char-judge-serious.png',
    position: 'center',
  },
  appealJudge: {
    key: 'appealJudge',
    name: '海瑞',
    role: '二审法官 Agent',
    portrait: '/art/vn/char-appeal-judge-neutral.png',
    position: 'center',
  },
  opponentLawyer: {
    key: 'opponentLawyer',
    name: '赵雪',
    role: '被告律师 Agent',
    portrait: '/art/vn/char-opponent-lawyer-confident.png',
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
};

export const lifecycleStages: LifecycleStage[] = [
  { code: 'LC', title: '咨询', status: 'done' },
  { code: 'CD', title: '起诉状', status: 'active' },
  { code: 'DD', title: '答辩状', status: 'upcoming' },
  { code: 'CI', title: '一审', status: 'upcoming' },
  { code: 'AD', title: '上诉', status: 'upcoming' },
  { code: 'CIA', title: '二审', status: 'upcoming' },
];
