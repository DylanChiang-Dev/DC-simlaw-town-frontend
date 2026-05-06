export type OnboardingStepId =
  | 'case-picker'
  | 'opening-dialogue'
  | 'text-input'
  | 'document-followup'
  | 'document-drafting'
  | 'court-argument'
  | 'closing-score'
  | 'markdown-review';

export type OnboardingStepKind = 'light' | 'key';

export type OnboardingStep = {
  id: OnboardingStepId;
  kind: OnboardingStepKind;
  title: string;
  phaseLabel: string;
  description: string;
  example: string;
  scoringFocus: string;
};

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'case-picker',
    kind: 'light',
    title: '选择案件',
    phaseLabel: '流程入口',
    description: '先选择一个案件，系统会从咨询、文书、庭审推进到结案评分。',
    example: '你只需要先选案并启动流程，后续输入会在对应节点出现。',
    scoringFocus: '评分重点会从后续玩家提交开始计算，选案本身不计分。',
  },
  {
    id: 'opening-dialogue',
    kind: 'light',
    title: '观看开场与角色对白',
    phaseLabel: '案件叙事',
    description: '角色对白会一句一句显示。请先确认当前对白，再处理玩家任务。',
    example: '如果看到“Agent 正在生成下一句”，代表系统正在推进，不需要重置案件。',
    scoringFocus: '开场阶段帮助你理解事实背景，后续输入会考察你是否抓住这些事实。',
  },
  {
    id: 'text-input',
    kind: 'key',
    title: '输入当前角色回复',
    phaseLabel: '玩家发言',
    description: '轮到你作为当前方律师回应时，先交代事实理解、代理目标和下一步策略。',
    example: '短示例：我方认为对方应承担主要责任；我会继续核对事故经过、治疗票据和误工证明。请结合本案事实改写。',
    scoringFocus: '评分重点：事实把握、法律目标、沟通清晰度。',
  },
  {
    id: 'document-followup',
    kind: 'key',
    title: '文书前追问',
    phaseLabel: '文书准备',
    description: '文书阶段先向当事人追问。当前规则要求至少完成 2 轮追问后再开始起草。',
    example: '短示例：请补充本项诉讼请求对应的证据、金额来源和对方可能争议点。请结合本案事实改写。',
    scoringFocus: '评分重点：追问质量、事实补全、证据意识。',
  },
  {
    id: 'document-drafting',
    kind: 'key',
    title: '起草并确认文书',
    phaseLabel: '文书起草',
    description: '你可以套用模板、请求智能体润色，但最终提交前要自己确认文书内容。',
    example: '短示例：围绕诉讼请求、事实与理由、证据目录组织文本，不新增无来源事实。请结合本案事实改写。',
    scoringFocus: '评分重点：文书结构、请求清晰度、事实与证据对应关系。',
  },
  {
    id: 'court-argument',
    kind: 'key',
    title: '庭审与辩论输入',
    phaseLabel: '庭审表达',
    description: '庭审阶段应围绕争点回应，对对方观点进行有证据支撑的反驳。',
    example: '短示例：我方坚持责任划分和损失金额依据，并指出对方抗辩缺少证据支持。请结合本案事实改写。',
    scoringFocus: '评分重点：争点回应、法律论证、表达与职业沟通。',
  },
  {
    id: 'closing-score',
    kind: 'key',
    title: '查看结案评分',
    phaseLabel: '评分',
    description: '案件结束后，系统会基于玩家提交和完整流程上下文生成表现评价。',
    example: '短示例：重点查看事实把握、法律论证、程序/任务完成、表达与职业沟通四类反馈。',
    scoringFocus: '评分重点：完整流程表现，而不是简单用胜负代替能力。',
  },
  {
    id: 'markdown-review',
    kind: 'light',
    title: '导出复盘 Markdown',
    phaseLabel: '复盘',
    description: '完整提交和对话记录不在评分弹窗里展开，建议导出复盘 Markdown 查看。',
    example: '导出的复盘包含玩家提交、关键对话和评分结果，适合展示或课后复盘。',
    scoringFocus: '复盘用于回看评分依据，帮助你定位下一轮要改进的输入质量。',
  },
];

export function getOnboardingStepById(stepId: OnboardingStepId | null | undefined): OnboardingStep | null {
  if (!stepId) return null;
  return ONBOARDING_STEPS.find((step) => step.id === stepId) || null;
}

export function getOnboardingStepIndex(stepId: OnboardingStepId | null | undefined): number {
  if (!stepId) return -1;
  return ONBOARDING_STEPS.findIndex((step) => step.id === stepId);
}
