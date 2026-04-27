export type CharacterKey =
  | 'playerLawyer'
  | 'client'
  | 'receptionist'
  | 'judge'
  | 'opponentLawyer';

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
  playerLawyer: {
    key: 'playerLawyer',
    name: '原告代理人',
    role: '用户在本案中临时扮演的代理人角色',
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
  receptionist: {
    key: 'receptionist',
    name: '律所前台',
    role: '前台接待与律师推荐',
    portrait: '/art/vn/char-receptionist-warm.png',
    position: 'right',
  },
  judge: {
    key: 'judge',
    name: '海瑞',
    role: '一审法官 Agent',
    portrait: '/art/vn/char-judge-serious.png',
    position: 'center',
  },
  opponentLawyer: {
    key: 'opponentLawyer',
    name: '程律师',
    role: '被告律师 Agent',
    portrait: '/art/vn/char-opponent-lawyer-confident.png',
    position: 'right',
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
