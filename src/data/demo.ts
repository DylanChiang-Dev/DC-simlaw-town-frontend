export type LifecycleStage = {
  code: string;
  title: string;
  description: string;
  status: 'done' | 'active' | 'upcoming';
};

export type AgentDemo = {
  name: string;
  role: string;
  status: string;
  tools: string[];
  skills: string[];
};

export const lifecycleStages: LifecycleStage[] = [
  { code: 'LC', title: '法律咨询', description: '当事人陈述事实，律师追问关键证据。', status: 'done' },
  { code: 'CD', title: '起诉状', description: '玩家律师基于模板起草诉请与事实。', status: 'active' },
  { code: 'DD', title: '答辩状', description: '被告律师形成抗辩思路与文书。', status: 'upcoming' },
  { code: 'CI', title: '一审庭审', description: '法官组织举证、质证和法庭调查。', status: 'upcoming' },
  { code: 'AD', title: '上诉状', description: '一审后进入二审诉讼策略。', status: 'upcoming' },
  { code: 'CIA', title: '二审庭审', description: '终审阶段完成争议收束。', status: 'upcoming' },
];

export const agents: AgentDemo[] = [
  {
    name: '李婷',
    role: '玩家原告律师',
    status: '等待玩家确认起诉状模板字段',
    tools: ['search_laws', 'draft_complaint_document'],
    skills: ['lawyer-complaint-drafting', 'lawyer-memory-writing'],
  },
  {
    name: '刘玉田',
    role: '原告当事人',
    status: '提供借款事实与证据线索',
    tools: ['save_client_memory'],
    skills: ['client-memory-writing'],
  },
  {
    name: '海瑞',
    role: '审判长 Agent',
    status: '待一审庭审阶段激活',
    tools: ['search_laws', 'draft_first_instance_judgment_document'],
    skills: ['courtroom-reasoning'],
  },
];

export const playerTask = {
  title: '完善起诉状关键字段',
  stage: 'CD 起诉状起草',
  body: '系统已根据咨询记录生成文书骨架。请确认诉讼请求、事实与理由、证据目录是否完整。',
  actions: ['查看模板', '生成草稿', '确认提交'],
};

export const metrics = [
  { label: '生命周期阶段', value: '6' },
  { label: '可展示 Agent', value: '21' },
  { label: '法律工具', value: '12+' },
  { label: '项目 Skill', value: '6' },
];
