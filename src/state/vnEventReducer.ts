import { characters, scenes, type CharacterKey, type DialogueScene } from '../data/demo';

const STAGE_LABELS: Record<string, string> = {
  LC: '法律咨询',
  CD: '起诉状起草',
  DD: '答辩状起草',
  TIA: '一审庭前分析',
  CI: '一审庭审',
  AD: '上诉状起草',
  AR: '上诉答辩起草',
  TIAA: '二审庭前分析',
  CIA: '二审庭审',
  FINAL_VERDICT: '终审判决',
};

const BACKGROUND_BY_STAGE: Record<string, string> = {
  LC: '/art/vn/bg-law-office.png',
  CD: '/art/vn/bg-case-analysis-room.png',
  DD: '/art/vn/bg-case-analysis-room.png',
  TIA: '/art/vn/bg-case-analysis-room.png',
  CI: '/art/vn/bg-courtroom.png',
  AD: '/art/vn/bg-case-analysis-room.png',
  AR: '/art/vn/bg-case-analysis-room.png',
  TIAA: '/art/vn/bg-case-analysis-room.png',
  CIA: '/art/vn/bg-courtroom.png',
  FINAL_VERDICT: '/art/vn/bg-courtroom.png',
};

const CHARACTERS_BY_STAGE: Record<string, CharacterKey[]> = {
  LC: ['playerLawyer', 'client'],
  CD: ['playerLawyer', 'client'],
  DD: ['playerLawyer', 'opponentLawyer'],
  CI: ['playerLawyer', 'judge', 'opponentLawyer'],
  AD: ['playerLawyer', 'client'],
  AR: ['playerLawyer', 'opponentLawyer'],
  CIA: ['playerLawyer', 'judge', 'opponentLawyer'],
};

const CASE_EVENT_MESSAGES: Record<string, string> = {
  CASE_STARTED: '案件已启动，系统正在安排第一轮咨询。',
  PLAINTIFF_ARRIVED: '当事人已进入咨询，正在准备案情说明。',
  CLIENT_ARRIVED: '当事人已进入咨询，正在准备案情说明。',
  CONSULTATION_STARTED: '法律咨询开始，等待当事人说明情况。',
  STAGE_STARTED: '新阶段已开始，等待下一轮案件对话。',
  STAGE_COMPLETED: '当前阶段已完成，案件流程正在推进。',
  DOCUMENT_DRAFT_STARTED: '文书起草阶段开始，等待玩家律师处理。',
  TRIAL_STARTED: '庭审阶段开始，等待法庭发言。',
};

export type VnRuntimeState = {
  diagnostics: string[];
  history: DialogueHistoryEntry[];
  scene: DialogueScene;
  wsConnected: boolean;
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
};

export type VnRuntimeEvent =
  | { type: 'ws-connected' }
  | { type: 'ws-disconnected' }
  | { type: 'dialogue-update'; payload?: Record<string, unknown> }
  | { type: 'dialogue-continue-sent'; payload?: Record<string, unknown> }
  | { type: 'dialogue-gate-accepted'; payload?: Record<string, unknown> }
  | { type: 'dialogue-gate-error'; payload?: Record<string, unknown> }
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

export function createInitialVnRuntimeState(): VnRuntimeState {
  return {
    diagnostics: [],
    history: [],
    scene: scenes[0],
    wsConnected: false,
  };
}

export function vnEventReducer(state: VnRuntimeState, event: VnRuntimeEvent): VnRuntimeState {
  switch (event.type) {
    case 'ws-connected':
      return appendDiagnostic({ ...state, wsConnected: true }, '实时连接已建立');
    case 'ws-disconnected':
      return appendErrorLine(
        appendDiagnostic({ ...state, wsConnected: false }, '实时连接已断开'),
        '实时连接已断开，系统正在自动重连。',
      );
    case 'dialogue-update':
      return applyDialogueUpdate(state, event.payload || {});
    case 'dialogue-continue-sent':
      return appendSystemLine(state, '已请求后端继续生成下一句，等待后端返回。');
    case 'dialogue-gate-accepted':
      return appendSystemLine(state, '后端已收到继续请求，正在推进下一句对话。');
    case 'dialogue-gate-error':
      return appendErrorLine(state, `继续失败：${String(event.payload?.message || '后端没有接受继续请求')}`);
    case 'case-state-change':
      return appendSystemLine(state, getCaseStateMessage(event.payload || {}));
    case 'scenario-start':
      return applyScenarioStart(state, event.payload || {});
    case 'scenario-end':
      return appendSystemLine(state, `${getStageName(event.payload?.scenario_type)}已结束`);
    case 'case-runtime-issue':
      return applyRuntimeIssue(state, event.payload || {});
    case 'player-lawyer-input-required':
      return appendSystemLine(state, '轮到玩家律师行动：请准备输入回复或处理文书任务。');
    case 'player-lawyer-input-submitted':
      return appendSystemLine(state, '玩家律师回复已提交，后端流程继续推进。');
    case 'player-lawyer-document-draft-ready':
      return appendSystemLine(state, '文书草稿已生成，等待玩家律师确认。');
    case 'player-lawyer-document-confirmed':
      return appendSystemLine(state, '玩家律师已确认文书，系统正在保存并导出 PDF。');
    case 'player-lawyer-error':
      return appendErrorLine(state, `玩家律师请求失败：${String(event.payload?.message || event.payload?.error || '请稍后重试')}`);
    case 'ws-error':
      return appendErrorLine(
        appendDiagnostic(state, `实时连接异常：${String(event.payload?.message || '未知错误')}`),
        `实时连接异常：${String(event.payload?.message || '未知错误')}`,
      );
    case 'ws-unknown':
      return appendErrorLine(
        appendDiagnostic(state, `未知后端事件：${String(event.payload?.type || 'unknown')}`),
        `未知后端事件：${String(event.payload?.type || 'unknown')}`,
      );
    default:
      return state;
  }
}

function applyDialogueUpdate(state: VnRuntimeState, payload: Record<string, unknown>): VnRuntimeState {
  const speaker = inferSpeaker(payload);
  const stageCode = normalizeStageCode(payload.scenario_type || payload.stage || state.scene.stageCode);
  const scene = createSceneFromState(state.scene, {
    characters: inferCharacters(stageCode, speaker),
    speaker,
    stageCode,
    text: String(payload.content || '收到新的案件对话。'),
  });
  return appendHistory({ ...state, scene }, scene, 'dialogue');
}

function applyScenarioStart(state: VnRuntimeState, payload: Record<string, unknown>): VnRuntimeState {
  const stageCode = normalizeStageCode(payload.scenario_type || payload.stage || state.scene.stageCode);
  const text = `当前阶段：${getStageName(stageCode)}。系统正在等待后端生成下一轮对话。`;
  const speaker = stageCode === 'CI' || stageCode === 'CIA' ? 'judge' : 'playerLawyer';
  const scene = createSceneFromState(state.scene, {
    characters: inferCharacters(stageCode, speaker),
    speaker,
    stageCode,
    text,
  });
  return appendDiagnostic({ ...state, scene }, `进入阶段 ${stageCode}`);
}

function applyRuntimeIssue(state: VnRuntimeState, payload: Record<string, unknown>): VnRuntimeState {
  const stageCode = normalizeStageCode(payload.scenario_type || state.scene.stageCode);
  const scene = createSceneFromState(state.scene, {
    characters: inferCharacters(stageCode, 'playerLawyer'),
    speaker: 'playerLawyer',
    stageCode,
    text: String(payload.message || '后端运行异常，当前案件流程已暂停。'),
  });
  return appendHistory(
    appendDiagnostic({ ...state, scene }, `运行异常：${String(payload.code || 'UNKNOWN')}`),
    scene,
    'error',
  );
}

function appendSystemLine(state: VnRuntimeState, text: string): VnRuntimeState {
  const scene = createSceneFromState(state.scene, {
    speaker: state.scene.speaker,
    text,
  });
  return appendHistory({ ...state, scene }, scene, 'system');
}

function appendErrorLine(state: VnRuntimeState, text: string): VnRuntimeState {
  const scene = createSceneFromState(state.scene, {
    speaker: state.scene.speaker,
    text,
  });
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
): VnRuntimeState {
  const text = scene.text.trim();
  if (!text) return state;
  const last = state.history[state.history.length - 1];
  if (last?.text === text && last.stageCode === scene.stageCode && last.speaker === scene.speaker) {
    return state;
  }

  const speaker = characters[scene.speaker];
  const entry: DialogueHistoryEntry = {
    id: `${scene.stageCode}-${Date.now()}-${state.history.length}`,
    kind,
    speaker: scene.speaker,
    speakerName: kind === 'system' ? '系统' : speaker.name,
    stageCode: scene.stageCode,
    stageName: scene.stageName,
    text,
    timestamp: new Date().toISOString(),
  };
  return {
    ...state,
    history: [...state.history, entry].slice(-40),
  };
}

function getCaseStateMessage(payload: Record<string, unknown>): string {
  const eventName = String(payload.event || payload.type || '').trim().toUpperCase();
  return CASE_EVENT_MESSAGES[eventName] || '案件流程正在推进，等待下一轮案件对话。';
}

function createSceneFromState(
  scene: DialogueScene,
  overrides: Partial<Pick<DialogueScene, 'characters' | 'speaker' | 'stageCode' | 'text'>>,
): DialogueScene {
  const stageCode = overrides.stageCode || scene.stageCode;
  const stageName = getStageName(stageCode);
  return {
    ...scene,
    background: BACKGROUND_BY_STAGE[stageCode] || scene.background,
    characters: overrides.characters || scene.characters,
    id: `live-${stageCode.toLowerCase()}`,
    speaker: overrides.speaker || scene.speaker,
    stageCode,
    stageName,
    text: overrides.text || scene.text,
    tech: {
      ...scene.tech,
      pipeline: `${stageCode} ${stageName}`,
    },
  };
}

function inferSpeaker(payload: Record<string, unknown>): CharacterKey {
  const value = `${payload.speaker_name || payload.speaker_id || ''}`.toLowerCase();
  if (value.includes('judge') || value.includes('法官') || value.includes('审判')) return 'judge';
  if (value.includes('defendant') || value.includes('被告') || value.includes('程')) return 'opponentLawyer';
  if (value.includes('client') || value.includes('当事人') || value.includes('刘玉田')) return 'client';
  if (value.includes('lawyer') || value.includes('律师')) return 'playerLawyer';
  return 'playerLawyer';
}

function inferCharacters(stageCode: string, speaker: CharacterKey): CharacterKey[] {
  const base = CHARACTERS_BY_STAGE[stageCode] || ['playerLawyer', 'client'];
  return base.includes(speaker) ? base : [speaker, ...base].filter((key, index, list) => list.indexOf(key) === index);
}

function normalizeStageCode(value: unknown): string {
  const raw = String(value || '').trim().toUpperCase();
  return raw || 'LC';
}

function getStageName(value: unknown): string {
  const stageCode = normalizeStageCode(value);
  return STAGE_LABELS[stageCode] || stageCode;
}
