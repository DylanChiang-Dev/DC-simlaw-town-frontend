import type { DialogueScene } from '../data/runtimeScene';
import type { TownRadarRuntimeState } from '../state/useTownRadarRuntime';
import type {
  AuthUser,
  CaseClosingEvaluation,
  CaseDocumentEntry,
  PlayerLawyerRequest,
  RuntimeTechCatalog,
  SimulationStatus,
} from '../services/types';
import type { DialogueHistoryEntry, RuntimeStatus } from '../state/vnEventReducer';

export type FrontendDemoSceneId = 'consult' | 'reply' | 'document' | 'court' | 'closing';

export type FrontendDemoWorkbench =
  | { kind: 'none' }
  | { kind: 'reply'; request: PlayerLawyerRequest; draft: string; polished: string }
  | { kind: 'document'; request: PlayerLawyerRequest; documentText: string; followups: Array<{ question: string; answer: string }> }
  | { kind: 'court'; request: PlayerLawyerRequest; draft: string }
  | {
      kind: 'closing';
      caseTitle: string;
      documents: CaseDocumentEntry[];
      evaluation: CaseClosingEvaluation;
      playerTurnCount: number;
    };

export type FrontendDemoScene = {
  id: FrontendDemoSceneId;
  title: string;
  scene: DialogueScene;
  history: DialogueHistoryEntry[];
  currentEntry: DialogueHistoryEntry;
  radar: TownRadarRuntimeState & { visibleActors: TownRadarRuntimeState['actors'][string][] };
  simulation: SimulationStatus;
  runtimeStatus: RuntimeStatus;
  workbench: FrontendDemoWorkbench;
};

export const FRONTEND_DEMO_SCENE_IDS: FrontendDemoSceneId[] = ['consult', 'reply', 'document', 'court', 'closing'];

const CASE_ID = 'demo-full-life-cycle-001';
const CASE_TITLE = '机动车交通事故责任纠纷';
const NOW = '2026-05-06T20:50:00.000+08:00';

export const DEMO_USER: AuthUser = {
  email: 'demo-reviewer@simailaw.local',
  id: 'demo-user',
  status: 'active',
  tokenVersion: 1,
};

const TECH_CATALOG: RuntimeTechCatalog = {
  tools: {
    core: [
      item('search_laws', '法条检索', '检索民法典、司法解释与程序法依据'),
      item('search_cases', '类案检索', '检索相似交通事故裁判观点'),
      item('check_citations', '法条引用校验', '校验文书和庭审观点中的引用'),
      item('read_case_artifact', '读取案件产物', '读取已生成的文书、笔录与判决结果'),
    ],
    extension: [
      item('compare_documents', '文书差异比较', '比对人工输入与智能体润色稿'),
      item('run_case_benchmark_evaluation', '单案评测', '结案后生成玩家表现评分'),
    ],
  },
  skills: {
    runtime: [
      item('lawyer-complaint-drafting', '起诉状起草规则', '约束诉状结构、诉请和事实依据'),
      item('lawyer-appeal-response-drafting', '上诉答辩状起草规则', '约束二审答辩结构和回应重点'),
      item('client-memory-writing', '当事人记忆写入规则', '沉淀当事人事实、诉求与风险偏好'),
      item('lawyer-memory-writing', '律师记忆写入规则', '沉淀律师策略和案件推进结论'),
    ],
  },
};

function item(id: string, displayName: string, description: string) {
  return { category: 'demo', description, displayName, id, runtimeStatus: 'available' };
}

function baseScene(patch: Partial<DialogueScene>): DialogueScene {
  return {
    actions: ['查看文书', '新手导航', '自动下一句'],
    background: '/art/vn/bg-law-office.png',
    caseId: CASE_ID,
    caseTitle: CASE_TITLE,
    characters: ['playerLawyer'],
    id: `frontend-demo-${patch.stageCode || 'PLC'}`,
    playerSeat: '当前角色：原告律师李婷',
    speaker: 'playerLawyer',
    stageCode: 'PLC',
    stageName: '原告咨询',
    text: '',
    tech: {
      activeSkills: [],
      activeTools: [],
      agent: '原告律师 Agent · 李婷',
      catalog: TECH_CATALOG,
      lastTechEventAt: NOW,
      memory: '已读取当事人事故经过、医疗费用、误工损失和调解底线。',
      pipeline: '法律全生命周期：咨询 -> 文书 -> 一审 -> 上诉 -> 二审 -> 评分',
      skills: ['client-memory-writing', 'lawyer-memory-writing'],
      tools: ['search_laws', 'search_cases', 'read_case_artifact'],
      usedSkills: { 'client-memory-writing': 1, 'lawyer-memory-writing': 1 },
      usedTools: { read_case_artifact: 1, search_cases: 1, search_laws: 1 },
    },
    ...patch,
  };
}

function entry(
  id: string,
  stageCode: string,
  stageName: string,
  speaker: DialogueHistoryEntry['speaker'],
  speakerName: string,
  text: string,
  patch: Partial<DialogueHistoryEntry> = {},
): DialogueHistoryEntry {
  return {
    caseId: CASE_ID,
    id,
    kind: 'dialogue',
    speaker,
    speakerName,
    stageCode,
    stageName,
    text,
    timestamp: NOW,
    turn: 0,
    ...patch,
  };
}

function systemEntry(id: string, stageCode: string, stageName: string, text: string): DialogueHistoryEntry {
  return {
    caseId: CASE_ID,
    id,
    kind: 'system',
    speaker: 'system',
    speakerName: '系统',
    stageCode,
    stageName,
    text,
    timestamp: NOW,
  };
}

function request(stage: string, prompt: string, contextSummary: string): PlayerLawyerRequest {
  return {
    caseId: CASE_ID,
    contextSummary,
    createdAt: NOW,
    message: '等待用户处理当前角色任务',
    prompt,
    requestId: `demo-request-${stage.toLowerCase()}`,
    role: 'plaintiff_lawyer',
    sandboxId: 926,
    speakerLabel: '李婷',
    stage,
    status: 'pending',
  };
}

function simulation(status: string, stageLabel: string): SimulationStatus {
  return {
    activeCases: 1,
    agentCapabilities: [],
    canPause: true,
    canRestart: true,
    canStart: true,
    clientsConnected: 1,
    lastError: null,
    paused: false,
    selectedCaseId: CASE_ID,
    sessionId: 'demo-session',
    sessionStatus: stageLabel,
    simulationRunning: status === 'running',
    status,
  };
}

function runtimeStatus(phase: string, message: string): RuntimeStatus {
  return {
    blocking: false,
    detail: CASE_ID,
    lastError: '',
    lastEventAt: NOW,
    message,
    phase,
  };
}

function radar(stageCode: string, actors: Array<{ id: string; label: string; kind: TownRadarRuntimeState['actors'][string]['kind']; locationId: TownRadarRuntimeState['actors'][string]['locationId']; nodeId?: TownRadarRuntimeState['actors'][string]['nodeId']; active?: boolean; moving?: boolean }>): TownRadarRuntimeState & { visibleActors: TownRadarRuntimeState['actors'][string][] } {
  const mapped = actors.map((actor) => ({
    ...actor,
    updatedAt: Date.now(),
  }));
  return {
    actors: Object.fromEntries(mapped.map((actor) => [actor.id, actor])),
    lastEventAt: Date.now(),
    lastRawLocationId: stageCode,
    visibleActors: mapped,
  };
}

const consultHistory = [
  systemEntry('demo-system-start', 'PLC', '原告咨询', '案件已启动，系统进入原告咨询阶段。'),
  entry(
    'demo-consult-client',
    'PLC',
    '原告咨询',
    'case6Plaintiff',
    '张国明',
    '事故发生在下班途中，对方车辆突然变道。我现在最担心的是后续治疗费、误工损失，以及对方保险一直拖延。',
    { generationDurationSeconds: 4.2, generationTotalTokens: 1180, turn: 1 },
  ),
  entry(
    'demo-consult-current',
    'PLC',
    '原告咨询',
    'playerLawyer',
    '李婷',
    '我先确认三个重点：事故责任认定、医疗票据和收入证明。系统会把这些事实写入当事人记忆，并在后续起诉状、庭审和二审答辩中持续复用。',
    { generationDurationSeconds: 5.6, generationTotalTokens: 1420, playerResponsibility: true, evaluationMarkerLabel: '纳入评价', evaluationMarkerReason: '当前为玩家代理人的实质性法律回复。', turn: 2 },
  ),
];

const replyRequest = request(
  'PLC',
  '请以原告律师身份回应当事人，说明下一步要补充哪些事实和证据，并给出清晰的诉讼准备路径。',
  '当事人陈述：对方变道导致碰撞，已有事故责任认定书、门诊病历和部分票据；误工收入证明仍缺失。',
);

const documentRequest = request(
  'CD',
  '请在起诉状起草前向当事人追问关键事实，至少补齐事故责任、损失金额、证据材料和诉讼请求。',
  '当前案件已完成原告咨询。系统准备进入起诉状起草，但医疗费、误工费和护理费的证据链仍需要进一步确认。',
);

const courtRequest = request(
  'CI',
  '法庭询问原告方对责任比例和赔偿项目的意见。请代表原告律师完成庭审陈述。',
  '一审庭审正在进行。对方认可事故发生，但主张医疗费部分与本次事故无关，并对误工期提出异议。',
);

const replyHistory = [
  ...consultHistory,
  systemEntry('demo-reply-waiting', 'PLC', '原告咨询', '轮到用户处理当前角色任务。'),
];

const documentHistory = [
  ...consultHistory,
  systemEntry('demo-doc-start', 'CD', '起诉状起草', '起诉状起草阶段开始，等待用户补充事实并确认文书。'),
  entry(
    'demo-doc-current',
    'CD',
    '起诉状起草',
    'playerLawyer',
    '李婷',
    '起诉状不能只写结论。我们要先确认责任认定、损失项目、证据来源和诉请金额，再让文书技能生成结构化草稿。',
    { generationDurationSeconds: 6.8, generationTotalTokens: 1640, playerResponsibility: true, evaluationMarkerLabel: '纳入评价', turn: 0 },
  ),
];

const courtHistory = [
  ...documentHistory,
  systemEntry('demo-court-start', 'CI', '一审庭审', '一审正式开庭。'),
  entry(
    'demo-court-current',
    'CI',
    '一审庭审',
    'judge',
    '刘正',
    '原告方，请围绕事故责任、医疗费关联性和误工损失依据发表意见。请注意回应被告方刚才提出的异议。',
    { generationDurationSeconds: 3.1, generationTotalTokens: 820, turn: 3 },
  ),
];

const closingHistory = [
  ...courtHistory,
  systemEntry('demo-closing-current', 'CIA', '二审庭审', '本案已完成二审庭审并生成终审结果，系统正在展示结案评分与复盘材料。'),
];

export const FRONTEND_DEMO_SCENES: Record<FrontendDemoSceneId, FrontendDemoScene> = {
  consult: {
    currentEntry: consultHistory[consultHistory.length - 1],
    history: consultHistory,
    id: 'consult',
    radar: radar('PLC', [
      { active: true, id: 'player-lawyer', kind: 'playerLawyer', label: '李婷', locationId: 'lawfirmA', nodeId: 'consultationRoom' },
      { id: 'plaintiff', kind: 'plaintiff', label: '张国明', locationId: 'lawfirmA', nodeId: 'consultationRoom' },
      { id: 'receptionist', kind: 'receptionist', label: '律所前台', locationId: 'lawfirmA', nodeId: 'frontDesk' },
    ]),
    runtimeStatus: runtimeStatus('dialogue', '原告咨询对话生成完成'),
    scene: baseScene({
      background: '/art/vn/bg-law-office.png',
      characters: ['playerLawyer', 'case6Plaintiff'],
      speaker: 'playerLawyer',
      speakerLabel: '李婷',
      stageCode: 'PLC',
      stageName: '原告咨询',
      text: consultHistory[consultHistory.length - 1].text,
      tech: {
        ...baseScene({}).tech,
        activeSkills: ['client-memory-writing'],
        activeTools: ['load_client_memory', 'search_laws'],
        usedSkills: { 'client-memory-writing': 1, 'lawyer-memory-writing': 1 },
        usedTools: { load_client_memory: 1, search_cases: 1, search_laws: 2 },
      },
    }),
    simulation: simulation('running', '原告咨询'),
    title: '咨询与事实沉淀',
    workbench: { kind: 'none' },
  },
  reply: {
    currentEntry: replyHistory[replyHistory.length - 1],
    history: replyHistory,
    id: 'reply',
    radar: radar('PLC', [
      { active: true, id: 'player-lawyer', kind: 'playerLawyer', label: '李婷', locationId: 'lawfirmA', nodeId: 'consultationRoom' },
      { id: 'plaintiff', kind: 'plaintiff', label: '张国明', locationId: 'lawfirmA', nodeId: 'consultationRoom' },
    ]),
    runtimeStatus: runtimeStatus('waiting_player_task', '轮到用户处理当前角色任务'),
    scene: baseScene({
      background: '/art/vn/bg-law-office.png',
      characters: ['playerLawyer'],
      speaker: 'playerLawyer',
      speakerLabel: '李婷',
      stageCode: 'PLC',
      stageName: '原告咨询',
      text: replyRequest.prompt,
      tech: {
        ...baseScene({}).tech,
        activeSkills: ['lawyer-memory-writing'],
        activeTools: ['search_laws', 'compare_documents'],
        usedSkills: { 'client-memory-writing': 1, 'lawyer-memory-writing': 2 },
        usedTools: { compare_documents: 1, search_laws: 3 },
      },
    }),
    simulation: simulation('running', '等待用户回复'),
    title: '玩家回复工作台',
    workbench: {
      draft: '我建议先把事故责任认定书、完整病历、医疗票据和收入证明整理成清单。下一步我们会围绕责任比例、治疗关联性和各项损失金额形成诉讼请求，缺失的误工收入证明要优先补齐。',
      kind: 'reply',
      polished: '从现有材料看，我们会先固定事故责任、治疗经过和损失范围，再决定诉讼请求金额。请优先补充误工收入证明、完整医疗票据和后续治疗意见；这些材料会直接影响起诉状、庭审举证和最终赔偿项目。',
      request: replyRequest,
    },
  },
  document: {
    currentEntry: documentHistory[documentHistory.length - 1],
    history: documentHistory,
    id: 'document',
    radar: radar('CD', [
      { active: true, id: 'player-lawyer', kind: 'playerLawyer', label: '李婷', locationId: 'lawfirmA', nodeId: 'workstation' },
      { id: 'plaintiff', kind: 'plaintiff', label: '张国明', locationId: 'lawfirmA', nodeId: 'consultationRoom' },
    ]),
    runtimeStatus: runtimeStatus('player_document_draft_ready', '文书草稿已生成，等待确认'),
    scene: baseScene({
      background: '/art/vn/bg-document-desk.png',
      characters: ['playerLawyer'],
      speaker: 'playerLawyer',
      speakerLabel: '李婷',
      stageCode: 'CD',
      stageName: '起诉状起草',
      text: documentHistory[documentHistory.length - 1].text,
      tech: {
        ...baseScene({}).tech,
        activeSkills: ['lawyer-complaint-drafting'],
        activeTools: ['draft_complaint_document', 'check_citations'],
        usedSkills: { 'client-memory-writing': 1, 'lawyer-complaint-drafting': 1, 'lawyer-memory-writing': 2 },
        usedTools: { check_citations: 1, draft_complaint_document: 1, read_case_artifact: 2, search_laws: 3 },
      },
    }),
    simulation: simulation('running', '起诉状起草'),
    title: '文书追问与起草',
    workbench: {
      documentText: '民事起诉状\n\n诉讼请求：\n1. 判令被告赔偿医疗费、误工费、护理费等各项损失；\n2. 判令被告承担本案诉讼费用。\n\n事实与理由：\n事故发生后，公安交管部门已作出责任认定。原告因本次事故就医治疗并产生相应损失，相关票据、病历及收入证明将作为证据提交。',
      followups: [
        { question: '医疗费票据是否已经完整？', answer: '门诊和复查票据都有，住院押金单还在整理。' },
        { question: '误工收入证明能否提交？', answer: '单位可以出具工资流水和请假证明，本周内能补齐。' },
      ],
      kind: 'document',
      request: documentRequest,
    },
  },
  court: {
    currentEntry: courtHistory[courtHistory.length - 1],
    history: courtHistory,
    id: 'court',
    radar: radar('CI', [
      { active: true, id: 'judge', kind: 'judge', label: '刘正', locationId: 'courtFirstInstance' },
      { id: 'player-lawyer', kind: 'playerLawyer', label: '李婷', locationId: 'courtFirstInstance' },
      { id: 'opponent-lawyer', kind: 'opponentLawyer', label: '赵雪', locationId: 'courtFirstInstance' },
    ]),
    runtimeStatus: runtimeStatus('trial_argument', '一审庭审正在进行'),
    scene: baseScene({
      background: '/art/vn/bg-courtroom.png',
      characters: ['judge', 'playerLawyer', 'opponentLawyer'],
      speaker: 'judge',
      speakerLabel: '刘正',
      stageCode: 'CI',
      stageName: '一审庭审',
      text: courtHistory[courtHistory.length - 1].text,
      tech: {
        ...baseScene({}).tech,
        activeSkills: ['lawyer-memory-writing'],
        activeTools: ['search_cases', 'check_citations'],
        agent: '一审法庭 Agent · 刘正',
        usedSkills: { 'lawyer-memory-writing': 3 },
        usedTools: { check_citations: 2, read_case_artifact: 3, search_cases: 2, search_laws: 4 },
      },
    }),
    simulation: simulation('running', '一审庭审'),
    title: '庭审发言与争点回应',
    workbench: {
      draft: '原告方认为，事故责任认定书能够证明被告变道行为与损害结果之间具有直接因果关系。医疗费部分有病历、票据和复查记录相互印证；误工损失将以单位证明和工资流水为依据。对被告关于关联性的异议，我方请求法院结合治疗时间、伤情诊断和医嘱综合认定。',
      kind: 'court',
      request: courtRequest,
    },
  },
  closing: {
    currentEntry: closingHistory[closingHistory.length - 1],
    history: closingHistory,
    id: 'closing',
    radar: radar('CIA', [
      { active: true, id: 'appeal-judge', kind: 'judge', label: '海瑞', locationId: 'courtSecondInstance' },
      { id: 'player-lawyer', kind: 'playerLawyer', label: '李婷', locationId: 'courtSecondInstance' },
      { id: 'opponent-lawyer', kind: 'opponentLawyer', label: '赵雪', locationId: 'courtSecondInstance' },
    ]),
    runtimeStatus: runtimeStatus('case_closed', '本案已结案'),
    scene: baseScene({
      background: '/art/vn/bg-appeal-courtroom.png',
      characters: [],
      speaker: 'system',
      speakerLabel: '系统',
      stageCode: 'CIA',
      stageName: '二审庭审',
      text: closingHistory[closingHistory.length - 1].text,
      tech: {
        ...baseScene({}).tech,
        activeSkills: ['lawyer-memory-writing'],
        activeTools: ['run_case_benchmark_evaluation', 'read_case_artifact'],
        agent: '结案评价 Agent',
        memory: '已写回本案事实争点、玩家提交、文书质量和庭审表现。',
        pipeline: '终审判决完成，进入结案评分与 Markdown 复盘导出。',
        usedSkills: { 'client-memory-writing': 2, 'lawyer-memory-writing': 4 },
        usedTools: { read_case_artifact: 5, run_case_benchmark_evaluation: 1, search_cases: 2, search_laws: 4 },
      },
    }),
    simulation: simulation('closed', '已结案'),
    title: '结案评分与复盘',
    workbench: {
      caseTitle: CASE_TITLE,
      documents: [
        documentItem('complaint', 'CD', '民事起诉状', 'complaint-demo.pdf'),
        documentItem('judgment-first', 'CI', '一审判决书', 'first-instance-judgment-demo.pdf'),
        documentItem('judgment-second', 'CIA', '二审判决书', 'second-instance-judgment-demo.pdf'),
      ],
      evaluation: {
        dimensions: [
          { label: '事实把握', maxScore: 25, score: 22 },
          { label: '法律论证', maxScore: 25, score: 21 },
          { label: '程序/任务完成', maxScore: 25, score: 24 },
          { label: '表达与职业沟通', maxScore: 25, score: 23 },
        ],
        generatedAt: NOW,
        improvements: ['庭审中可以更早回应对方关于治疗关联性的质疑。', '文书诉请金额部分还可以进一步拆分计算依据。'],
        overallScore: 90,
        strengths: ['追问覆盖事实、金额、证据和诉讼目标。', '文书结构完整，庭审发言能回应主要争点。'],
        summary: '本轮玩家完成了咨询回复、起诉状追问与起草、一审庭审发言和二审阶段回应。系统根据事实把握、法律论证、程序完成度和表达质量给出综合评价。',
      },
      kind: 'closing',
      playerTurnCount: 7,
    },
  },
};

function documentItem(documentKey: string, stage: string, title: string, fileName: string): CaseDocumentEntry {
  return {
    available: true,
    caseId: CASE_ID,
    documentKey,
    documentType: stage,
    downloadUrl: '#',
    fileName,
    stage,
    title,
  };
}

export function getFrontendDemoSceneId(value: string | null): FrontendDemoSceneId {
  return FRONTEND_DEMO_SCENE_IDS.includes(value as FrontendDemoSceneId)
    ? value as FrontendDemoSceneId
    : 'consult';
}
