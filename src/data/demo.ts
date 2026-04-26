export type CharacterKey =
  | 'playerLawyer'
  | 'client'
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

export const scenes: DialogueScene[] = [
  {
    id: 'consultation',
    caseTitle: '民间借贷纠纷教学案',
    playerSeat: '当前角色：刘玉田案原告代理人',
    stageCode: 'LC',
    stageName: '法律咨询',
    background: '/art/vn/bg-law-office.png',
    speaker: 'client',
    text: '律师，我现在最担心的是证据不够。借款记录、转账截图和聊天记录我都有，但不知道哪些能真正支持起诉。',
    characters: ['playerLawyer', 'client'],
    actions: ['追问借款事实', '整理证据目录', '进入起诉状起草'],
    tech: {
      agent: 'PlayerPlaintiffLawyerAgent',
      tools: ['save_client_memory', 'search_laws'],
      skills: ['client-memory-writing'],
      memory: '记录当事人核心诉求与证据线索',
      pipeline: 'LC 法律咨询 -> CD 起诉状起草',
    },
  },
  {
    id: 'drafting',
    caseTitle: '民间借贷纠纷教学案',
    playerSeat: '当前角色：刘玉田案原告代理人',
    stageCode: 'CD',
    stageName: '起诉状起草',
    background: '/art/vn/bg-case-analysis-room.png',
    speaker: 'playerLawyer',
    text: '我们先不要直接写长文。系统会把诉讼请求、事实与理由、证据目录拆成模板字段，由用户确认后再生成正式起诉状。',
    characters: ['playerLawyer', 'client'],
    actions: ['打开文书工作台', '调用起诉状 Skill', '确认提交'],
    tech: {
      agent: 'PlayerPlaintiffLawyerAgent',
      tools: ['draft_complaint_document', 'search_laws'],
      skills: ['lawyer-complaint-drafting', 'lawyer-memory-writing'],
      memory: '沉淀争议焦点、事实链和最低证据清单',
      pipeline: 'CD 文书辅助 -> PDF 导出 -> 法院立案',
    },
  },
  {
    id: 'trial',
    caseTitle: '民间借贷纠纷教学案',
    playerSeat: '当前角色：刘玉田案原告代理人',
    stageCode: 'CI',
    stageName: '一审庭审',
    background: '/art/vn/bg-courtroom.png',
    speaker: 'judge',
    text: '现在进入法庭调查。原告律师先围绕借贷合意、款项交付和还款期限陈述主张，被告律师随后回应。',
    characters: ['playerLawyer', 'judge', 'opponentLawyer'],
    actions: ['陈述诉讼请求', '出示证据', '请求法庭归纳争点'],
    tech: {
      agent: 'JudgeAgent',
      tools: ['search_laws', 'draft_first_instance_judgment_document'],
      skills: ['courtroom-reasoning'],
      memory: '读取前序咨询、文书与证据状态',
      pipeline: 'CI 一审庭审 -> 判决生成 -> AD 上诉决策',
    },
  },
];

export const lifecycleStages: LifecycleStage[] = [
  { code: 'LC', title: '咨询', status: 'done' },
  { code: 'CD', title: '起诉状', status: 'active' },
  { code: 'DD', title: '答辩状', status: 'upcoming' },
  { code: 'CI', title: '一审', status: 'upcoming' },
  { code: 'AD', title: '上诉', status: 'upcoming' },
  { code: 'CIA', title: '二审', status: 'upcoming' },
];
