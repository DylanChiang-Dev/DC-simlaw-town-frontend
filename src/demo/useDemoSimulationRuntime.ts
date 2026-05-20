import { useMemo, useState } from 'react';
import { getCaseArtProfile } from '../data/caseArt';
import type { CharacterKey, DialogueScene } from '../data/runtimeScene';
import type { RadarActor } from '../data/townRadarModel';
import type { PlayerLawyerRequest, PlayerLawyerSkill, SimulationStatus } from '../services/types';
import type { DialogueHistoryEntry, RuntimeStatus } from '../state/vnEventReducer';
import { DEMO_CASES, findDemoCase } from './demoCases';
import type { DemoCase, DemoRunStep, DemoStage, DemoStageCode, DemoTask } from './demoTypes';

const DEMO_USER = {
  email: 'demo@legal-world.local',
  id: 'offline-demo-user',
  status: 'active',
  tokenVersion: 1,
};
const NOW = '2026-05-20T10:00:00.000+08:00';

export function useDemoSimulationRuntime() {
  const [selectedCaseId, setSelectedCaseId] = useState('');
  const [step, setStep] = useState<DemoRunStep | null>(null);
  const [submittedTaskKeys, setSubmittedTaskKeys] = useState<Record<string, boolean>>({});
  const [confirmedDocumentKeys, setConfirmedDocumentKeys] = useState<Record<string, boolean>>({});
  const [closingOpen, setClosingOpen] = useState(false);

  const selectedCase = selectedCaseId ? findDemoCase(selectedCaseId) : null;
  const history = useMemo(() => selectedCase && step ? buildHistory(selectedCase, step, submittedTaskKeys, confirmedDocumentKeys) : [], [
    confirmedDocumentKeys,
    selectedCase,
    step,
    submittedTaskKeys,
  ]);
  const activeStage = selectedCase && step && step.type !== 'closing'
    ? selectedCase.stages[step.stageIndex]
    : selectedCase
      ? selectedCase.stages[selectedCase.stages.length - 1]
      : null;
  const activeEntry = step?.type === 'stage'
    ? history.find((entry) => entry.id === entryId(step.stageIndex, step.entryIndex))
    : step?.type === 'task'
      ? history.find((entry) => entry.id === taskEntryId(step.stageIndex))
      : step?.type === 'document'
        ? history.find((entry) => entry.id === documentEntryId(step.stageIndex))
        : history[history.length - 1] || null;
  const scene = selectedCase && activeStage
    ? buildScene(selectedCase, activeStage, activeEntry || null)
    : buildIdleScene();
  const radar = selectedCase && activeStage ? buildRadar(selectedCase, activeStage) : { actors: {}, lastEventAt: 0, lastRawLocationId: '', visibleActors: [] };
  const activeTask = selectedCase && step?.type === 'task' ? selectedCase.stages[step.stageIndex].task || null : null;
  const activeRequest = selectedCase && activeStage && activeTask
    ? buildRequest(selectedCase, activeStage, activeTask)
    : null;
  const documentSkill = activeTask?.kind === 'document' && activeStage
    ? buildDocumentSkill(activeStage)
    : null;
  const simulation = buildSimulation(selectedCase, Boolean(step), step?.type === 'closing');
  const runtimeStatus = buildRuntimeStatus(selectedCase, step, activeStage);

  function startCase(caseId = selectedCaseId) {
    const demoCase = findDemoCase(caseId);
    if (!demoCase) return;
    setSelectedCaseId(demoCase.caseId);
    setSubmittedTaskKeys({});
    setConfirmedDocumentKeys({});
    setClosingOpen(false);
    setStep({ type: 'stage', stageIndex: 0, entryIndex: 0 });
  }

  function reset() {
    setStep(null);
    setSubmittedTaskKeys({});
    setConfirmedDocumentKeys({});
    setClosingOpen(false);
  }

  function exitCase() {
    reset();
    setSelectedCaseId('');
  }

  function advance() {
    if (!selectedCase || !step) return;
    if (step.type === 'closing') {
      setClosingOpen(true);
      return;
    }
    const stage = selectedCase.stages[step.stageIndex];
    if (step.type === 'stage') {
      if (step.entryIndex < stage.entries.length - 1) {
        setStep({ ...step, entryIndex: step.entryIndex + 1 });
        return;
      }
      if (stage.task) {
        setStep({ type: 'task', stageIndex: step.stageIndex });
        return;
      }
      if (stage.document) {
        setStep({ type: 'document', stageIndex: step.stageIndex });
        return;
      }
      moveToNextStage(step.stageIndex);
      return;
    }
    if (step.type === 'task') return;
    if (step.type === 'document') {
      moveToNextStage(step.stageIndex);
    }
  }

  function submitTask() {
    if (!selectedCase || step?.type !== 'task') return;
    setSubmittedTaskKeys((current) => ({ ...current, [stepKey(selectedCase.caseId, step.stageIndex)]: true }));
    const stage = selectedCase.stages[step.stageIndex];
    if (stage.document) {
      setStep({ type: 'document', stageIndex: step.stageIndex });
    } else {
      moveToNextStage(step.stageIndex);
    }
  }

  function confirmDocument() {
    if (!selectedCase || step?.type !== 'document') return;
    setConfirmedDocumentKeys((current) => ({ ...current, [stepKey(selectedCase.caseId, step.stageIndex)]: true }));
    moveToNextStage(step.stageIndex);
  }

  function moveToNextStage(stageIndex: number) {
    if (!selectedCase) return;
    if (stageIndex < selectedCase.stages.length - 1) {
      setStep({ type: 'stage', stageIndex: stageIndex + 1, entryIndex: 0 });
      return;
    }
    setStep({ type: 'closing' });
    setClosingOpen(true);
  }

  return {
    activeEntry,
    activeRequest,
    activeStage,
    activeTask,
    advance,
    caseOptions: DEMO_CASES,
    closingOpen,
    confirmDocument,
    documentSkill,
    exitCase,
    history,
    radar,
    reset,
    runtimeStatus,
    scene,
    selectedCase,
    selectedCaseId,
    setClosingOpen,
    setSelectedCaseId,
    simulation,
    startCase,
    step,
    submitTask,
    user: DEMO_USER,
  };
}

function buildHistory(
  demoCase: DemoCase,
  step: DemoRunStep,
  submittedTaskKeys: Record<string, boolean>,
  confirmedDocumentKeys: Record<string, boolean>,
): DialogueHistoryEntry[] {
  const entries: DialogueHistoryEntry[] = [];
  const finalStageIndex = step.type === 'closing' ? demoCase.stages.length - 1 : step.stageIndex;
  for (let stageIndex = 0; stageIndex <= finalStageIndex; stageIndex += 1) {
    const stage = demoCase.stages[stageIndex];
    const lastEntryIndex = step.type === 'stage' && step.stageIndex === stageIndex
      ? step.entryIndex
      : stage.entries.length - 1;
    for (let entryIndex = 0; entryIndex <= lastEntryIndex; entryIndex += 1) {
      const source = stage.entries[entryIndex];
      entries.push({
        caseId: demoCase.caseId,
        evaluationMarkerLabel: source.playerResponsibility ? '纳入评价' : undefined,
        evaluationMarkerReason: source.playerResponsibility ? '演示模式中的用户职责节点。' : undefined,
        generationDurationSeconds: source.speaker === 'system' ? undefined : 4.2 + ((stageIndex + entryIndex) % 4),
        generationTotalTokens: source.speaker === 'system' ? undefined : 900 + stageIndex * 180 + entryIndex * 70,
        id: entryId(stageIndex, entryIndex),
        kind: source.speaker === 'system' ? 'system' : 'dialogue',
        playerResponsibility: source.playerResponsibility,
        speaker: source.speaker,
        speakerName: source.speakerName,
        stageCode: stage.code,
        stageName: stage.title,
        text: source.text,
        timestamp: NOW,
        turn: entryIndex,
      });
    }
    const taskKeyValue = stepKey(demoCase.caseId, stageIndex);
    if (submittedTaskKeys[taskKeyValue] && stage.task) {
      entries.push({
        caseId: demoCase.caseId,
        id: taskEntryId(stageIndex),
        kind: 'dialogue',
        playerResponsibility: true,
        evaluationMarkerLabel: '玩家职责',
        evaluationMarkerReason: '用户点击提交的关键节点内容。',
        speaker: stage.task.kind === 'court' ? 'playerLawyer' : 'playerLawyer',
        speakerName: '李婷',
        stageCode: stage.code,
        stageName: stage.title,
        text: stage.task.presetText,
        timestamp: NOW,
        turn: stage.entries.length,
      });
    }
    if (confirmedDocumentKeys[taskKeyValue] && stage.document) {
      entries.push({
        caseId: demoCase.caseId,
        id: documentEntryId(stageIndex),
        kind: 'system',
        speaker: 'system',
        speakerName: '系统',
        stageCode: stage.code,
        stageName: stage.title,
        text: `${stage.document.title}已确认，文书进入案件卷宗。`,
        timestamp: NOW,
      });
    }
  }
  if (step.type === 'closing') {
    entries.push({
      caseId: demoCase.caseId,
      id: 'demo-closing-summary',
      kind: 'system',
      speaker: 'system',
      speakerName: '系统',
      stageCode: 'CIA',
      stageName: '二审庭审',
      text: `${demoCase.closing.finalJudgment}\n\n结案评分已生成，点击“查看评分”可打开复盘。`,
      timestamp: NOW,
    });
  }
  return entries;
}

function buildScene(demoCase: DemoCase, stage: DemoStage, activeEntry: DialogueHistoryEntry | null): DialogueScene {
  const art = getCaseArtProfile(demoCase.caseId);
  const speaker = activeEntry?.speaker || stage.speaker;
  return {
    actions: ['继续下一句', '提交任务', '查看评分'],
    background: getStageBackground(stage.code, demoCase.caseId),
    caseId: demoCase.caseId,
    caseTitle: demoCase.title,
    characters: getStageCharacters(stage.code, demoCase),
    id: `demo-${demoCase.caseId}-${stage.code}`,
    playerSeat: '当前角色：演示用户 / 原告律师李婷',
    speaker,
    speakerLabel: activeEntry?.speakerName || stage.speakerName,
    stageCode: stage.code,
    stageName: stage.title,
    text: activeEntry?.text || stage.sceneText,
    tech: {
      activeSkills: stage.activeSkills,
      activeTools: stage.activeTools,
      agent: getStageAgent(stage.code),
      catalog: null,
      lastTechEventAt: NOW,
      memory: stage.memory,
      pipeline: stage.pipeline,
      skills: stage.activeSkills,
      tools: stage.activeTools,
      usedSkills: Object.fromEntries(stage.activeSkills.map((name) => [name, 1])),
      usedTools: Object.fromEntries(stage.activeTools.map((name) => [name, 1])),
    },
  };
}

function buildIdleScene(): DialogueScene {
  return {
    actions: [],
    background: '/art/vn/bg-case-analysis-room.png',
    caseTitle: '三分钟离线演示',
    characters: [],
    id: 'demo-idle',
    playerSeat: '选择案件后开始',
    speaker: 'system',
    stageCode: 'SYSTEM',
    stageName: '演示入口',
    text: '请选择一个案件进入三分钟全流程演示。',
    tech: {
      activeSkills: [],
      activeTools: [],
      agent: '离线演示运行时',
      catalog: null,
      lastTechEventAt: '',
      memory: '演示数据来自真实流程材料抽取与精修。',
      pipeline: '六案可选，每案覆盖咨询到终审。',
      skills: [],
      tools: [],
      usedSkills: {},
      usedTools: {},
    },
  };
}

function buildRequest(demoCase: DemoCase, stage: DemoStage, task: DemoTask): PlayerLawyerRequest {
  return {
    caseId: demoCase.caseId,
    contextSummary: task.contextSummary,
    createdAt: NOW,
    message: '离线演示正在等待用户点击处理关键节点。',
    prompt: task.prompt,
    requestId: `demo-${demoCase.caseId}-${stage.code}`,
    role: 'plaintiff_lawyer',
    sandboxId: 0,
    speakerLabel: '李婷',
    stage: stage.code,
    status: 'pending',
  };
}

function buildDocumentSkill(stage: DemoStage): PlayerLawyerSkill {
  return {
    description: `${stage.title}演示模板`,
    documentType: stage.code,
    name: stage.document?.title || `${stage.title}文书`,
    path: 'offline-demo',
    qualityCheck: ['请求清晰', '事实对应证据', '不新增无来源事实', '保留法院可调整空间'],
    skillId: getDocumentSkillId(stage.code),
    templateText: stage.task?.presetText || stage.document?.text || '',
    templateTitle: stage.document?.title || `${stage.title}参考模板`,
  };
}

function buildSimulation(demoCase: DemoCase | null, running: boolean, closed = false): SimulationStatus {
  return {
    activeCases: running && demoCase ? 1 : 0,
    agentCapabilities: [],
    canPause: false,
    canRestart: Boolean(demoCase),
    canStart: true,
    clientsConnected: 1,
    lastError: null,
    paused: false,
    selectedCaseId: demoCase?.caseId || '',
    sessionId: demoCase ? `offline-demo-${demoCase.caseId}` : null,
    sessionStatus: closed ? '已结案' : running ? '离线演示运行中' : '未启动',
    simulationRunning: running && !closed,
    status: closed ? 'closed' : running ? 'running' : 'idle',
  };
}

function buildRuntimeStatus(demoCase: DemoCase | null, step: DemoRunStep | null, stage: DemoStage | null): RuntimeStatus {
  if (!demoCase || !step || !stage) {
    return {
      blocking: false,
      detail: '',
      lastError: '',
      lastEventAt: '',
      message: '请选择案件开始演示',
      phase: 'demo_idle',
    };
  }
  if (step.type === 'task') {
    return {
      blocking: true,
      detail: stage.code,
      lastError: '',
      lastEventAt: NOW,
      message: '等待用户处理演示任务',
      phase: 'waiting_demo_task',
    };
  }
  if (step.type === 'closing') {
    return {
      blocking: false,
      detail: demoCase.caseId,
      lastError: '',
      lastEventAt: NOW,
      message: '演示案件已结案',
      phase: 'demo_closed',
    };
  }
  return {
    blocking: false,
    detail: stage.code,
    lastError: '',
    lastEventAt: NOW,
    message: `${stage.title}演示中`,
    phase: 'demo_running',
  };
}

function buildRadar(demoCase: DemoCase, stage: DemoStage) {
  const location = stage.code === 'DLC' || stage.code === 'DD' || stage.code === 'AR' ? 'lawfirmB'
    : stage.code === 'CI' ? 'courtFirstInstance'
      : stage.code === 'CIA' ? 'courtSecondInstance'
        : 'lawfirmA';
  const nodeId = stage.code === 'CD' || stage.code === 'DD' || stage.code === 'AD' || stage.code === 'AR'
    ? 'workstation'
    : stage.code === 'PLC' || stage.code === 'DLC'
      ? 'consultationRoom'
      : undefined;
  const actors: RadarActor[] = [
    {
      active: stage.speaker === 'playerLawyer',
      id: 'player-lawyer',
      kind: 'playerLawyer',
      label: '李婷',
      locationId: location,
      nodeId,
    },
    {
      active: stage.speaker === demoCase.plaintiffKey,
      id: 'plaintiff',
      kind: 'plaintiff',
      label: demoCase.plaintiffName,
      locationId: stage.code === 'DLC' || stage.code === 'DD' || stage.code === 'AR' ? 'lawfirmA' : location,
      nodeId: stage.code === 'PLC' ? 'consultationRoom' : nodeId,
    },
    {
      active: stage.speaker === demoCase.defendantKey,
      id: 'defendant',
      kind: 'defendant',
      label: demoCase.defendantName,
      locationId: stage.code === 'DLC' || stage.code === 'DD' || stage.code === 'AR' ? 'lawfirmB' : location,
      nodeId,
    },
    {
      active: stage.speaker === 'judge' || stage.speaker === 'appealJudge',
      id: 'judge',
      kind: 'judge',
      label: stage.code === 'CIA' ? '海瑞' : '刘正',
      locationId: stage.code === 'CIA' ? 'courtSecondInstance' : 'courtFirstInstance',
    },
  ];
  return {
    actors: Object.fromEntries(actors.map((actor) => [actor.id, { ...actor, updatedAt: Date.now() }])),
    lastEventAt: Date.now(),
    lastRawLocationId: stage.code,
    visibleActors: actors,
  };
}

function getStageBackground(stageCode: DemoStageCode, caseId: string): string {
  if (stageCode === 'CI') return '/art/vn/bg-courtroom.png';
  if (stageCode === 'CIA') return '/art/vn/bg-appeal-courtroom.png';
  if (stageCode === 'CD' || stageCode === 'DD' || stageCode === 'AD' || stageCode === 'AR') return '/art/vn/bg-document-desk.png';
  if (stageCode === 'PLC' || stageCode === 'DLC') return '/art/vn/bg-law-office.png';
  return getCaseArtProfile(caseId).caseCg;
}

function getStageCharacters(stageCode: DemoStageCode, demoCase: DemoCase): CharacterKey[] {
  if (stageCode === 'CI') return ['judge', 'playerLawyer', 'opponentLawyer'];
  if (stageCode === 'CIA') return ['appealJudge', 'playerLawyer', 'opponentLawyer'];
  if (stageCode === 'DLC' || stageCode === 'DD' || stageCode === 'AR') return [demoCase.defendantKey, 'opponentLawyer'];
  return [demoCase.plaintiffKey, 'playerLawyer'];
}

function getStageAgent(stageCode: DemoStageCode): string {
  if (stageCode === 'CI') return '一审法庭 Agent · 刘正';
  if (stageCode === 'CIA') return '二审法庭 Agent · 海瑞';
  if (stageCode === 'DLC' || stageCode === 'DD' || stageCode === 'AR') return '被告律师 Agent · 赵雪';
  return '原告律师 Agent · 李婷';
}

function getDocumentSkillId(stageCode: string): string {
  const map: Record<string, string> = {
    AD: 'lawyer-appeal-drafting',
    AR: 'lawyer-appeal-response-drafting',
    CD: 'lawyer-complaint-drafting',
    DD: 'lawyer-defense-drafting',
  };
  return map[stageCode] || 'demo-document-drafting';
}

function stepKey(caseId: string, stageIndex: number): string {
  return `${caseId}:${stageIndex}`;
}

function entryId(stageIndex: number, entryIndex: number): string {
  return `demo-entry-${stageIndex}-${entryIndex}`;
}

function taskEntryId(stageIndex: number): string {
  return `demo-task-submitted-${stageIndex}`;
}

function documentEntryId(stageIndex: number): string {
  return `demo-document-confirmed-${stageIndex}`;
}
