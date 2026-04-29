import { characters, type CharacterKey, type DialogueScene } from '../data/runtimeScene';

const STAGE_LABELS: Record<string, string> = {
  SYSTEM: '系统运行',
  RECEPTION: '前台导引',
  PLC: '原告咨询',
  CD: '起诉状起草',
  DLC: '被告咨询',
  LC: '法律咨询',
  DD: '答辩状起草',
  TIA: '一审庭前分析',
  CI: '一审庭审',
  AD: '上诉状起草',
  AR: '上诉答辩状起草',
  TIAA: '二审庭前分析',
  CIA: '二审庭审',
  FINAL_VERDICT: '终审判决',
};

const BACKGROUND_BY_STAGE: Record<string, string> = {
  SYSTEM: '/art/vn/bg-case-analysis-room.png',
  RECEPTION: '/art/vn/bg-reception-desk.png',
  PLC: '/art/vn/bg-law-office.png',
  CD: '/art/vn/bg-document-desk.png',
  DLC: '/art/vn/bg-law-office.png',
  LC: '/art/vn/bg-law-office.png',
  DD: '/art/vn/bg-document-desk.png',
  TIA: '/art/vn/bg-case-analysis-room.png',
  CI: '/art/vn/bg-courtroom.png',
  AD: '/art/vn/bg-document-desk.png',
  AR: '/art/vn/bg-document-desk.png',
  TIAA: '/art/vn/bg-case-analysis-room.png',
  CIA: '/art/vn/bg-appeal-courtroom.png',
  FINAL_VERDICT: '/art/vn/bg-appeal-courtroom.png',
  EVIDENCE: '/art/vn/cg-case9-traffic-accident-overview.png',
  TRAFFIC_ACCIDENT: '/art/vn/cg-case9-traffic-accident-overview.png',
};

const CASE_EVENT_MESSAGES: Record<string, string> = {
  CASE_STARTED: '案件已启动，系统正在安排第一轮咨询。',
  PLAINTIFF_ARRIVED: '当事人已进入咨询，正在准备案情说明。',
  DEFENDANT_ARRIVED: '被告已收到法院送达，正在前往律所咨询应对。',
  CLIENT_ARRIVED: '当事人已进入咨询，正在准备案情说明。',
  CONSULTATION_STARTED: '法律咨询开始，等待当事人说明情况。',
  STAGE_STARTED: '新阶段已开始，等待下一轮案件对话。',
  STAGE_COMPLETED: '当前阶段已完成，案件流程正在推进。',
  DOCUMENT_DRAFT_STARTED: '文书起草阶段开始，等待用户处理当前角色任务。',
  TRIAL_STARTED: '庭审阶段开始，等待法庭发言。',
  CASE_ASSIGNED: '律师已分配，即将进入法律咨询。',
  COMPLAINT_DRAFTING_COMPLETED: '起诉状起草已结束，即将向法院递交。',
  LAWSUIT_FILED: '起诉状已递交法院，等待被告方响应。',
  DEFENSE_DRAFTING_COMPLETED: '答辩状起草已结束，即将向法院递交。',
  DEFENSE_FILED: '答辩状已递交法院，即将进入一审庭审。',
  ENTER_TRIAL_FIRST_INSTANCE: '一审正式开庭。',
  TRIAL_FIRST_INSTANCE_COMPLETED: '一审庭审已结束，等待判决及后续。',
  APPEAL_DECISION_MADE: '当事人已决定上诉，即将起草上诉状。',
  APPEAL_DRAFTING_COMPLETED: '上诉状起草已结束，即将向中级法院递交。',
  APPEAL_FILED: '上诉状已递交中级法院，等待被上诉人答辩。',
  APPEAL_RESPONSE_DRAFTING_COMPLETED: '上诉答辩状起草已结束，即将递交法院。',
  APPEAL_RESPONSE_FILED: '上诉答辩状已递交法院，即将进入二审庭审。',
  ENTER_TRIAL_SECOND_INSTANCE: '二审正式开庭。',
  TRIAL_SECOND_INSTANCE_COMPLETED: '二审庭审已结束，等待终审判决。',
  CASE_CLOSED: '本案已结案。',
};

const CASE_EVENT_STAGE_CODES: Record<string, string> = {
  PLAINTIFF_ARRIVED: 'PLC',
  DEFENDANT_ARRIVED: 'DLC',
  CLIENT_ARRIVED: 'PLC',
  CONSULTATION_STARTED: 'PLC',
  CASE_ASSIGNED: 'PLC',
  DOCUMENT_DRAFT_STARTED: 'CD',
  COMPLAINT_DRAFTING_COMPLETED: 'CD',
  LAWSUIT_FILED: 'CD',
  DEFENSE_DRAFTING_COMPLETED: 'DD',
  DEFENSE_FILED: 'DD',
  ENTER_TRIAL_FIRST_INSTANCE: 'CI',
  TRIAL_FIRST_INSTANCE_COMPLETED: 'CI',
  APPEAL_DECISION_MADE: 'AD',
  APPEAL_DRAFTING_COMPLETED: 'AD',
  APPEAL_FILED: 'AD',
  APPEAL_RESPONSE_DRAFTING_COMPLETED: 'AR',
  APPEAL_RESPONSE_FILED: 'AR',
  ENTER_TRIAL_SECOND_INSTANCE: 'CIA',
  TRIAL_SECOND_INSTANCE_COMPLETED: 'CIA',
  CASE_CLOSED: 'CIA',
};

const DOCUMENT_SCENARIO_END_STAGES = new Set(['CD', 'DD', 'AD', 'AR']);

export type VnRuntimeState = {
  background: DialogueHistoryEntry[];
  diagnostics: string[];
  history: DialogueHistoryEntry[];
  runtimeStatus: RuntimeStatus;
  scene: DialogueScene;
  wsConnected: boolean;
};

export type RuntimeStatus = {
  phase: string;
  message: string;
  detail: string;
  blocking: boolean;
  lastEventAt: string;
  lastError: string;
};

export type DialogueHistoryEntry = {
  id: string;
  kind: 'dialogue' | 'system' | 'error';
  speaker: CharacterKey;
  speakerName: string;
  stageCode: string;
  stageName: string;
  text: string;
  timestamp: string;
  turn?: number;
};

export type VnRuntimeEvent =
  | { type: 'ws-connected' }
  | { type: 'ws-disconnected' }
  | { type: 'runtime-reset' }
  | { type: 'dialogue-update'; payload?: Record<string, unknown> }
  | { type: 'dialogue-continue-sent'; payload?: Record<string, unknown> }
  | { type: 'dialogue-gate-waiting'; payload?: Record<string, unknown> }
  | { type: 'dialogue-gate-accepted'; payload?: Record<string, unknown> }
  | { type: 'dialogue-gate-error'; payload?: Record<string, unknown> }
  | { type: 'runtime-progress'; payload?: Record<string, unknown> }
  | { type: 'step-gate-waiting'; payload?: Record<string, unknown> }
  | { type: 'step-gate-accepted'; payload?: Record<string, unknown> }
  | { type: 'step-gate-error'; payload?: Record<string, unknown> }
  | { type: 'case-state-change'; payload?: Record<string, unknown> }
  | { type: 'scenario-start'; payload?: Record<string, unknown> }
  | { type: 'scenario-end'; payload?: Record<string, unknown> }
  | { type: 'case-runtime-issue'; payload?: Record<string, unknown> }
  | { type: 'player-lawyer-input-required'; payload?: Record<string, unknown> }
  | { type: 'player-lawyer-input-submitted'; payload?: Record<string, unknown> }
  | { type: 'player-lawyer-document-draft-ready'; payload?: Record<string, unknown> }
  | { type: 'player-lawyer-document-confirmed'; payload?: Record<string, unknown> }
  | { type: 'player-lawyer-error'; payload?: Record<string, unknown> }
  | { type: 'ws-error'; payload?: Record<string, unknown> }
  | { type: 'ws-unknown'; payload?: Record<string, unknown> };

const SYSTEM_SCENE: DialogueScene = {
  id: 'system-idle',
  caseTitle: '等待案件进展',
  playerSeat: '当前角色：系统运行',
  stageCode: 'SYSTEM',
  stageName: '系统运行',
  background: '/art/vn/bg-case-analysis-room.png',
  speaker: 'system',
  text: '当前没有可展示的实时对话。页面正在等待案件状态恢复。',
  characters: [],
  actions: [],
  tech: {
    agent: '等待案件同步',
    tools: [],
    skills: [],
    memory: '等待真实案件状态恢复',
    pipeline: '等待案件进展',
  },
};

export function createInitialVnRuntimeState(): VnRuntimeState {
  return {
    background: [],
    diagnostics: [],
    history: [],
    runtimeStatus: {
      phase: 'idle',
      message: '等待案件运行',
      detail: '',
      blocking: false,
      lastEventAt: '',
      lastError: '',
    },
    scene: SYSTEM_SCENE,
    wsConnected: false,
  };
}

export function createSceneForHistoryEntry(scene: DialogueScene, entry: DialogueHistoryEntry): DialogueScene {
  return createSceneFromState(scene, {
    characters: entry.kind === 'dialogue' ? inferCharacters(entry.stageCode, entry.speaker) : [],
    speaker: entry.speaker,
    speakerLabel: entry.speakerName,
    stageCode: entry.stageCode,
    text: entry.text,
  });
}

export function vnEventReducer(state: VnRuntimeState, event: VnRuntimeEvent): VnRuntimeState {
  switch (event.type) {
    case 'runtime-reset':
      return {
        ...createInitialVnRuntimeState(),
        wsConnected: state.wsConnected,
      };
    case 'ws-connected':
      return appendDiagnostic(
        updateRuntimeStatus({ ...state, wsConnected: true }, {
          phase: 'connected',
          message: '实时连接已建立',
          detail: '',
          blocking: false,
          lastError: '',
        }),
        '实时连接已建立',
      );
    case 'ws-disconnected':
      return appendDiagnostic(
        updateRuntimeStatus({ ...state, wsConnected: false }, {
          phase: 'disconnected',
          message: '实时连接已断开',
          detail: '系统正在自动重连',
          blocking: true,
          lastError: '',
        }),
        '实时连接已断开，系统正在自动重连',
      );
    case 'dialogue-update':
      return applyDialogueUpdate(state, event.payload || {});
    case 'dialogue-continue-sent':
      return appendSystemLine(state, '已请求继续生成下一句，正在等待案件进展。');
    case 'dialogue-gate-waiting':
      return updateRuntimeStatus(state, {
        phase: 'waiting_dialogue_continue',
        message: '下一句已准备好，等待你继续',
        detail: String(event.payload?.speaker_name || event.payload?.gate_id || ''),
        blocking: true,
        lastError: '',
      });
    case 'dialogue-gate-accepted':
      return appendSystemLine(
        updateRuntimeStatus(state, {
          phase: 'dialogue_accepted',
          message: '已收到继续请求',
          detail: '正在推进下一句对话',
          blocking: false,
          lastError: '',
        }),
        '已收到继续请求，正在推进下一句对话。',
      );
    case 'dialogue-gate-error':
      return appendErrorLine(
        updateRuntimeStatus(state, {
          phase: 'dialogue_error',
          message: '继续失败',
          detail: '',
          blocking: true,
          lastError: String(event.payload?.message || '系统暂时没有接受继续请求'),
        }),
        `继续失败：${String(event.payload?.message || '系统暂时没有接受继续请求')}`,
      );
    case 'runtime-progress':
      return applyRuntimeProgress(state, event.payload || {});
    case 'step-gate-waiting':
      return updateRuntimeStatus(state, {
        phase: 'waiting_user',
        message: String(event.payload?.message || '等待用户继续推进'),
        detail: String(event.payload?.detail || event.payload?.gate_id || ''),
        blocking: true,
        lastError: '',
      });
    case 'step-gate-accepted':
      return updateRuntimeStatus(state, {
        phase: 'step_accepted',
        message: String(event.payload?.message || '已收到继续请求'),
        detail: String(event.payload?.detail || event.payload?.gate_id || ''),
        blocking: false,
        lastError: '',
      });
    case 'step-gate-error':
      return appendErrorLine(
        updateRuntimeStatus(state, {
          phase: 'step_error',
          message: '继续推进失败',
          detail: String(event.payload?.detail || ''),
          blocking: true,
          lastError: String(event.payload?.message || event.payload?.error || '系统暂时没有接受继续请求'),
        }),
        `继续推进失败：${String(event.payload?.message || event.payload?.error || '系统暂时没有接受继续请求')}`,
      );
    case 'case-state-change':
      return appendSystemLine(state, getCaseStateMessage(event.payload || {}), getCaseStateStageCode(event.payload || {}));
    case 'scenario-start':
      return applyScenarioStart(state, event.payload || {});
    case 'scenario-end':
      if (!shouldDisplayScenarioEndInStory(event.payload?.scenario_type)) {
        return state;
      }
      return appendSystemLine(state, `${getStageName(event.payload?.scenario_type)}已结束`, String(event.payload?.scenario_type || ''));
    case 'case-runtime-issue':
      return applyRuntimeIssue(state, event.payload || {});
    case 'player-lawyer-input-required':
      return updateRuntimeStatus(state, {
        phase: 'waiting_player_task',
        message: '轮到用户处理当前角色任务',
        detail: '请准备输入回复或处理文书任务',
        blocking: true,
        lastError: '',
      });
    case 'player-lawyer-input-submitted':
      return updateRuntimeStatus(state, {
        phase: 'player_task_submitted',
        message: '当前角色回复已提交，案件流程正在继续',
        detail: '',
        blocking: false,
        lastError: '',
      });
    case 'player-lawyer-document-draft-ready':
      return updateRuntimeStatus(state, {
        phase: 'player_document_draft_ready',
        message: '文书草稿已生成，等待确认',
        detail: '',
        blocking: true,
        lastError: '',
      });
    case 'player-lawyer-document-confirmed':
      return updateRuntimeStatus(state, {
        phase: 'player_document_confirmed',
        message: '文书已确认，案件流程正在继续',
        detail: '',
        blocking: false,
        lastError: '',
      });
    case 'player-lawyer-error':
      return appendErrorLine(state, `用户任务请求失败：${String(event.payload?.message || event.payload?.error || '请稍后重试')}`);
    case 'ws-error':
      return appendErrorLine(
        appendDiagnostic(
          updateRuntimeStatus(state, {
            phase: 'ws_error',
            message: '实时连接异常',
            detail: '',
            blocking: true,
            lastError: String(event.payload?.message || '未知错误'),
          }),
          `实时连接异常：${String(event.payload?.message || '未知错误')}`,
        ),
        `实时连接异常：${String(event.payload?.message || '未知错误')}`,
      );
    case 'ws-unknown':
      return appendErrorLine(
        appendDiagnostic(state, `未知系统消息：${String(event.payload?.type || 'unknown')}`),
        `未知系统消息：${String(event.payload?.type || 'unknown')}`,
      );
    default:
      return state;
  }
}

function applyRuntimeProgress(state: VnRuntimeState, payload: Record<string, unknown>): VnRuntimeState {
  const phase = String(payload.phase || 'runtime');
  const message = String(payload.message || '系统正在处理当前步骤');
  const nextState = applyRuntimeCapabilityDisplay(updateRuntimeStatus(state, {
    phase,
    message,
    detail: String(payload.detail || ''),
    blocking: Boolean(payload.blocking),
    lastEventAt: String(payload.occurred_at || ''),
    lastError: '',
  }), payload);
  if (phase === 'memory_checkpoint_complete') {
    const summary = createMemoryCheckpointSummary(payload);
    const stageCode = normalizeStageCode(payload.scenario_type || payload.stage || state.scene.stageCode);
    const displayState = applyRuntimeCapabilityDisplay(nextState, { ...payload, memory: summary });
    return appendSystemLine(displayState, summary, stageCode);
  }
  if (phase === 'memory_checkpoint') {
    const stageCode = normalizeStageCode(payload.scenario_type || payload.stage || state.scene.stageCode);
    return appendSystemLine(nextState, message, stageCode);
  }
  return nextState;
}

function applyRuntimeCapabilityDisplay(state: VnRuntimeState, payload: Record<string, unknown>): VnRuntimeState {
  const toolNames = readStringList(payload.tool_names);
  const skillNames = readStringList(payload.skill_names);
  const memory = String(payload.memory || payload.memory_summary || '').trim();
  if (toolNames.length === 0 && skillNames.length === 0 && !memory) return state;
  return {
    ...state,
    scene: {
      ...state.scene,
      tech: {
        ...state.scene.tech,
        tools: toolNames.length > 0 ? mergeRuntimeTags(state.scene.tech.tools, toolNames) : state.scene.tech.tools,
        skills: skillNames.length > 0 ? mergeRuntimeTags(state.scene.tech.skills, skillNames) : state.scene.tech.skills,
        memory: memory || state.scene.tech.memory,
      },
    },
  };
}

function createMemoryCheckpointSummary(payload: Record<string, unknown>): string {
  const events = Array.isArray(payload.memory_events)
    ? payload.memory_events.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object')
    : [];
  if (events.length === 0) {
    return String(payload.message || '长期记忆写回完成，未产生字段变更。');
  }
  const details = events.map((event) => {
    const owner = String(event.owner_label || '长期记忆');
    const agent = String(event.agent_name || event.agent_id || 'Agent');
    const status = String(event.status || 'completed');
    if (status === 'failed') return `${owner} ${agent}：写回失败`;
    if (status === 'skipped') return `${owner} ${agent}：无需写回`;
    const changedFields = readStringList(event.changed_fields);
    const changedText = changedFields.length > 0
      ? changedFields.slice(0, 5).join('、')
      : '未产生字段变更';
    return `${owner} ${agent}：${changedText}`;
  });
  return `长期记忆写回完成：${details.join('；')}`;
}

function readStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => String(item || '').trim())
    .filter(Boolean);
}

function mergeRuntimeTags(existing: string[], incoming: string[]): string[] {
  return Array.from(new Set([...existing, ...incoming])).slice(-8);
}

function updateRuntimeStatus(state: VnRuntimeState, patch: Partial<RuntimeStatus>): VnRuntimeState {
  return {
    ...state,
    runtimeStatus: {
      ...state.runtimeStatus,
      ...patch,
      lastEventAt: patch.lastEventAt ?? new Date().toISOString(),
    },
  };
}

function applyDialogueUpdate(state: VnRuntimeState, payload: Record<string, unknown>): VnRuntimeState {
  const text = String(payload.content || payload.dialogue_text || '收到新的案件对话。');
  const fallbackStageCode = normalizeStageCode(payload.scenario_type || payload.stage || state.scene.stageCode);
  const speaker = inferSpeaker(payload, fallbackStageCode, text);
  const stageCode = isReceptionPayload(payload, text)
    ? 'RECEPTION'
    : inferStageCodeForDialogue(payload.scenario_type || payload.stage, fallbackStageCode, speaker, text);
  const scene = createSceneFromState(state.scene, {
    characters: inferCharacters(stageCode, speaker),
    speaker,
    speakerLabel: getDialogueSpeakerLabel(payload, stageCode, speaker, text),
    stageCode,
    text,
  });
  if (isBackgroundDialogue(stageCode, scene.text)) {
    return appendBackground(state, scene);
  }
  return appendHistory({ ...state, scene }, scene, 'dialogue', readDialogueTurn(payload.turn));
}

function applyScenarioStart(state: VnRuntimeState, payload: Record<string, unknown>): VnRuntimeState {
  const stageCode = normalizeStageCode(payload.scenario_type || payload.stage || state.scene.stageCode);
  const stageName = getStageName(stageCode);
  const text = `当前阶段：${stageName}。系统正在生成下一轮对话。`;
  const scene = createSystemScene(state.scene, text, stageCode);
  const withDiag = appendDiagnostic({ ...state, scene }, `进入阶段 ${stageCode}`);
  return appendSystemLine(withDiag, `进入阶段：${stageName}`, stageCode);
}

function applyRuntimeIssue(state: VnRuntimeState, payload: Record<string, unknown>): VnRuntimeState {
  const stageCode = normalizeStageCode(payload.scenario_type || payload.stage || state.scene.stageCode);
  const scene = createSystemScene(state.scene, String(payload.message || '案件运行异常，当前案件流程已暂停。'), stageCode);
  return appendHistory(
    appendDiagnostic({ ...state, scene }, `运行异常：${String(payload.code || 'UNKNOWN')}`),
    scene,
    'error',
  );
}

function appendSystemLine(state: VnRuntimeState, text: string, stageCode = 'SYSTEM'): VnRuntimeState {
  const scene = createSystemScene(state.scene, text, stageCode);
  return appendHistory({ ...state, scene }, scene, 'system');
}

function appendErrorLine(state: VnRuntimeState, text: string): VnRuntimeState {
  const scene = createSystemScene(state.scene, text);
  return appendHistory({ ...state, scene }, scene, 'error');
}

function appendDiagnostic(state: VnRuntimeState, message: string): VnRuntimeState {
  return {
    ...state,
    diagnostics: [...state.diagnostics.slice(-5), message],
  };
}

function appendHistory(
  state: VnRuntimeState,
  scene: DialogueScene,
  kind: DialogueHistoryEntry['kind'],
  turn?: number,
): VnRuntimeState {
  const text = scene.text.trim();
  if (!text) return state;
  const last = state.history[state.history.length - 1];
  if (last?.text === text && last.stageCode === scene.stageCode && last.speaker === scene.speaker) {
    return state;
  }

  const entry: DialogueHistoryEntry = {
    id: `${scene.stageCode}-${Date.now()}-${state.history.length}`,
    kind,
    speaker: scene.speaker,
    speakerName: kind === 'system' ? '系统' : getSceneSpeakerName(scene),
    stageCode: scene.stageCode,
    stageName: scene.stageName,
    text,
    timestamp: new Date().toISOString(),
    ...(typeof turn === 'number' ? { turn } : {}),
  };
  return {
    ...state,
    history: [...state.history, entry],
  };
}

function readDialogueTurn(value: unknown): number | undefined {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < 0) return undefined;
  return Math.floor(numeric);
}

function appendBackground(state: VnRuntimeState, scene: DialogueScene): VnRuntimeState {
  const text = scene.text.trim();
  if (!text) return state;
  const last = state.background[state.background.length - 1];
  if (last?.text === text && last.stageCode === scene.stageCode) {
    return state;
  }

  const entry: DialogueHistoryEntry = {
    id: `background-${scene.stageCode}-${Date.now()}-${state.background.length}`,
    kind: 'system',
    speaker: scene.speaker,
    speakerName: getSceneSpeakerName(scene),
    stageCode: scene.stageCode,
    stageName: scene.stageName,
    text,
    timestamp: new Date().toISOString(),
  };
  return {
    ...state,
    background: [...state.background, entry].slice(-12),
  };
}

function isBackgroundDialogue(stageCode: string, text: string): boolean {
  return false;
}

function isReceptionDialogueText(text: string): boolean {
  return isReceptionRecommendationText(text) || /前台|接待|欢迎来到本所/.test(text);
}

function isReceptionRecommendationText(text: string): boolean {
  return /【推荐律师[：:]/.test(text) || /推荐律师/.test(text);
}

function isReceptionPayload(payload: Record<string, unknown>, text: string): boolean {
  const speaker = `${payload.speaker_name || payload.speaker_id || ''}`.toLowerCase();
  const stage = `${payload.scenario_type || payload.stage || ''}`.toUpperCase();
  return stage === 'RECEPTION'
    || speaker.includes('reception')
    || speaker.includes('front_desk')
    || speaker.includes('前台')
    || speaker.includes('接待')
    || isReceptionDialogueText(text);
}

function getCaseStateMessage(payload: Record<string, unknown>): string {
  const eventName = String(payload.event || payload.type || '').trim().toUpperCase();
  return CASE_EVENT_MESSAGES[eventName] || '案件流程正在推进，等待下一轮案件对话。';
}

function getCaseStateStageCode(payload: Record<string, unknown>): string {
  const explicitStage = String(payload.scenario_type || payload.stage || '').trim();
  if (explicitStage) {
    return normalizeStageCode(explicitStage);
  }

  const eventName = String(payload.event || payload.type || '').trim().toUpperCase();
  const partyRole = String(payload.party_role || '').trim().toLowerCase();
  if (eventName === 'CASE_ASSIGNED' && partyRole === 'defendant') {
    return 'DLC';
  }

  return CASE_EVENT_STAGE_CODES[eventName]
    || inferStageCodeFromCaseState(payload.to_state)
    || inferStageCodeFromCaseState(payload.overall_state)
    || 'SYSTEM';
}

function inferStageCodeFromCaseState(value: unknown): string {
  const state = String(value || '').trim();
  if (!state) return '';
  if (state.includes('原告咨询')) return 'PLC';
  if (state.includes('被告咨询')) return 'DLC';
  if (state.includes('起诉状')) return 'CD';
  if (state.includes('答辩状') && !state.includes('上诉')) return 'DD';
  if (state.includes('上诉答辩')) return 'AR';
  if (state.includes('上诉状') || state.includes('上诉决策')) return 'AD';
  if (state.includes('二审')) return 'CIA';
  if (state.includes('一审') || state.includes('庭前')) return 'CI';
  return '';
}

function createSceneFromState(
  scene: DialogueScene,
  overrides: Partial<Pick<DialogueScene, 'characters' | 'speaker' | 'speakerLabel' | 'stageCode' | 'text'>>,
): DialogueScene {
  const stageCode = overrides.stageCode || scene.stageCode;
  const stageName = getStageName(stageCode);
  const speaker = overrides.speaker || scene.speaker;
  const speakerLabel = overrides.speakerLabel ?? (
    overrides.speaker && overrides.speaker !== scene.speaker ? undefined : scene.speakerLabel
  );
  return {
    ...scene,
    background: BACKGROUND_BY_STAGE[stageCode] || scene.background,
    characters: overrides.characters || scene.characters,
    id: `live-${stageCode.toLowerCase()}`,
    speaker,
    speakerLabel,
    stageCode,
    stageName,
    text: overrides.text || scene.text,
    tech: {
      ...scene.tech,
      pipeline: `${stageCode} ${stageName}`,
    },
  };
}

function createSystemScene(scene: DialogueScene, text: string, stageCode = 'SYSTEM'): DialogueScene {
  return createSceneFromState(scene, {
    characters: [],
    speaker: 'system',
    speakerLabel: '系统',
    stageCode,
    text,
  });
}

function inferSpeaker(payload: Record<string, unknown>, stageCode: string, text: string): CharacterKey {
  const speakerName = String(payload.speaker_name || '').trim();
  if (speakerName.includes('刘正')) return 'judge';
  if (speakerName.includes('海瑞')) return 'appealJudge';
  if (speakerName.includes('书记员')) return 'courtClerk';
  if (speakerName.includes('法官助理')) return 'judgeAssistant';
  if (speakerName.includes('律所前台') || speakerName.includes('前台') || speakerName.includes('接待')) return 'receptionist';
  if (speakerName.includes('程玉静')) return 'defendant';
  if (speakerName.includes('刘玉田')) return 'client';
  if (speakerName.includes('赵雪')) return 'opponentLawyer';
  if (speakerName.includes('李婷')) return 'playerLawyer';

  const value = `${payload.speaker_name || ''} ${payload.speaker_id || ''}`.toLowerCase();
  if (value.includes('reception') || value.includes('front_desk') || value.includes('前台') || value.includes('接待')) {
    return 'receptionist';
  }
  if (
    value.includes('plaintiff_lawyer')
    || value.includes('plaintiff lawyer')
    || value.includes('lawyer_b01')
    || value.includes('原告律师')
  ) return 'playerLawyer';
  if (
    value.includes('defendant_lawyer')
    || value.includes('defense_lawyer')
    || value.includes('defendant lawyer')
    || value.includes('defense lawyer')
    || value.includes('lawyer_b02')
    || value.includes('被告律师')
  ) return 'opponentLawyer';
  if (
    value.includes('defendant')
    || value.includes('cheng')
    || value.includes('程玉静')
    || value.includes('被告')
  ) return 'defendant';
  if (
    value.includes('client')
    || value.includes('plaintiff')
    || value.includes('case_')
    || value.includes('当事人')
    || value.includes('刘玉田')
  ) return 'client';
  if (stageCode === 'RECEPTION' || isReceptionPayload(payload, text)) {
    return 'receptionist';
  }
  if (
    value.includes('clerk')
    || value.includes('书记员')
  ) return 'courtClerk';
  if (
    value.includes('assistant')
    || value.includes('法官助理')
  ) return 'judgeAssistant';
  if (
    value.includes('traffic')
    || value.includes('accident')
    || value.includes('交警')
    || value.includes('事故认定')
  ) return 'trafficOfficer';
  if (
    value.includes('appeal')
    || value.includes('intermediate')
    || value.includes('second')
    || value.includes('二审')
    || value.includes('海瑞')
  ) return 'appealJudge';
  if (value.includes('judge') || value.includes('法官') || value.includes('审判')) {
    return stageCode === 'CIA' || stageCode === 'FINAL_VERDICT' ? 'appealJudge' : 'judge';
  }
  if (
    value.includes('zhao')
    || value.includes('赵雪')
    || value.includes('opponent')
    || value.includes('defense')
    || value.includes('被告律师')
  ) return 'opponentLawyer';
  if (value.includes('lawyer') || value.includes('律师') || value.includes('李婷')) return 'playerLawyer';
  return 'playerLawyer';
}

function inferStageCodeForDialogue(
  explicitStage: unknown,
  fallbackStageCode: string,
  speaker: CharacterKey,
  text: string,
): string {
  const explicit = String(explicitStage || '').trim();
  if (explicit) return normalizeStageCode(explicit);
  if (
    speaker === 'appealJudge'
  ) return 'CIA';
  if (
    speaker === 'judge'
    || speaker === 'courtClerk'
    || speaker === 'judgeAssistant'
  ) return 'CI';
  if (isSecondInstanceCourtProcedureText(text)) return 'CIA';
  if (isFirstInstanceCourtProcedureText(text)) return 'CI';
  return fallbackStageCode;
}

function isFirstInstanceCourtProcedureText(text: string): boolean {
  return /原告核对身份|被告核对身份|请原告本人陈述姓名|请被告本人陈述姓名|现在开庭|本庭已依法告知|诉讼权利和诉讼义务|是否申请回避|法庭纪律/.test(text);
}

function isSecondInstanceCourtProcedureText(text: string): boolean {
  return /上诉人核对身份|被上诉人核对身份|请上诉人本人陈述姓名|请被上诉人本人陈述姓名|二审现在开庭|二审庭审|中级法院开庭|终审判决/.test(text);
}

function getDialogueSpeakerLabel(
  payload: Record<string, unknown>,
  stageCode: string,
  speaker: CharacterKey,
  text: string,
): string {
  if (speaker === 'receptionist' || /推荐律师/.test(text)) {
    return '律所前台';
  }
  return String(payload.speaker_name || payload.speaker_id || characters[speaker].name).trim() || characters[speaker].name;
}

function getSceneSpeakerName(scene: DialogueScene): string {
  return String(scene.speakerLabel || characters[scene.speaker].name).trim();
}

function inferCharacters(stageCode: string, speaker: CharacterKey): CharacterKey[] {
  return [speaker];
}

function normalizeStageCode(value: unknown): string {
  const raw = String(value || '').trim().toUpperCase();
  return raw || 'LC';
}

function shouldDisplayScenarioEndInStory(scenarioType: unknown): boolean {
  const stageCode = normalizeStageCode(scenarioType);
  return !DOCUMENT_SCENARIO_END_STAGES.has(stageCode);
}

function getStageName(value: unknown): string {
  const stageCode = normalizeStageCode(value);
  return STAGE_LABELS[stageCode] || stageCode;
}
