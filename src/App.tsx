import { useEffect, useReducer, useState } from 'react';
import { AuthGate, type AuthGateState } from './components/AuthGate';
import { BuildVersionBadge } from './components/BuildVersionBadge';
import { CasePicker } from './components/CasePicker';
import { CaseClosingSummaryDialog } from './components/CaseClosingSummaryDialog';
import { CaseDocumentsPanel } from './components/CaseDocumentsPanel';
import { CaseTimeline } from './components/CaseTimeline';
import { CommandHud } from './components/CommandHud';
import { DialogueBox } from './components/DialogueBox';
import { OnboardingCoach } from './components/OnboardingCoach';
import { OnboardingGuideDialog } from './components/OnboardingGuideDialog';
import { PlayerLawyerInputDialog } from './components/PlayerLawyerInputDialog';
import { PlayerLawyerTaskPanel } from './components/PlayerLawyerTaskPanel';
import { TechLedger } from './components/TechLedger';
import { TownRadar } from './components/TownRadar';
import { VisualNovelStage } from './components/VisualNovelStage';
import { getEventBus } from './services/eventBus';
import {
  confirmManualPlayerLawyerDocument,
  createPlayerLawyerDocumentDraft,
  fetchPlayerLawyerDocumentSkills,
  sendPlayerLawyerDocumentFollowup,
} from './services/playerLawyerApi';
import { getWebSocketService } from './services/webSocket';
import { getOnboardingStepById } from './onboarding/onboardingContent';
import { getCurrentOnboardingStepId } from './onboarding/onboardingRuntime';
import { useOnboardingState } from './onboarding/useOnboardingState';
import { usePlayerLawyerRuntime } from './state/usePlayerLawyerRuntime';
import { useSimulationRuntime } from './state/useSimulationRuntime';
import { useTownRadarRuntime } from './state/useTownRadarRuntime';
import type { PlayerLawyerSkill, SimulationStatus } from './services/types';
import {
  createInitialVnRuntimeState,
  createSceneForHistoryEntry,
  vnEventReducer,
  type DialogueHistoryEntry,
} from './state/vnEventReducer';
import { fetchRuntimeTechCatalog } from './services/runtimeTechCatalogApi';

type DocumentFollowupPair = {
  question: string;
  answer: string;
};

type AppShellProps = {
  auth: AuthGateState;
};

type DialogueGateState = {
  gateId: string;
  pending: boolean;
  requestedAt?: number;
  speakerName: string;
  turn: number;
} | null;

const STAGE_DOCUMENT_TYPES: Record<string, string> = {
  CD: 'CD',
  DD: 'DD',
  AD: 'AD',
  AR: 'AR',
};
const AUTO_NEXT_STORAGE_KEY = 'simlaw-town:auto-next-enabled';
const AUTO_NEXT_ACKNOWLEDGE_DELAY_MS = 900;
const TECH_HIGHLIGHT_DURATION_MS = 4000;

function AppShell({ auth }: AppShellProps) {
  const [documentsOpen, setDocumentsOpen] = useState(false);
  const [, setDialogueGate] = useState<DialogueGateState>(null);
  const [playerDialogOpen, setPlayerDialogOpen] = useState(false);
  const [autoOpenedPlayerRequestId, setAutoOpenedPlayerRequestId] = useState('');
  const [acknowledgedDialogueEntryId, setAcknowledgedDialogueEntryId] = useState('');
  const [closingSummaryOpen, setClosingSummaryOpen] = useState(false);
  const [closingSummaryEntryId, setClosingSummaryEntryId] = useState('');
  const [documentPolishLoading, setDocumentPolishLoading] = useState(false);
  const [documentFollowupLoading, setDocumentFollowupLoading] = useState(false);
  const [documentFollowupHistoryByRequestId, setDocumentFollowupHistoryByRequestId] = useState<Record<string, DocumentFollowupPair[]>>({});
  const [documentSkills, setDocumentSkills] = useState<PlayerLawyerSkill[]>([]);
  const [restartConfirmOpen, setRestartConfirmOpen] = useState(false);
  const [autoNextEnabled, setAutoNextEnabled] = useState(() => readAutoNextPreference());
  const onboarding = useOnboardingState();
  const runtime = useSimulationRuntime(auth.backendConfigured && Boolean(auth.user));
  const playerLawyer = usePlayerLawyerRuntime(
    auth.backendConfigured && Boolean(auth.user),
    runtime.activeCaseId,
  );
  const [vnRuntime, dispatchVnEvent] = useReducer(vnEventReducer, undefined, createInitialVnRuntimeState);
  const scene = vnRuntime.scene;
  const nextUnacknowledgedStoryEntry = getNextUnacknowledgedStoryEntry(vnRuntime.history, acknowledgedDialogueEntryId);
  const displayedScene = nextUnacknowledgedStoryEntry
    ? createSceneForHistoryEntry(scene, nextUnacknowledgedStoryEntry)
    : scene;
  const townRadar = useTownRadarRuntime(displayedScene);
  const playerDialogMayAutoOpen = !nextUnacknowledgedStoryEntry;
  const latestAcknowledgedStoryEntry = getLatestAcknowledgedStoryEntry(vnRuntime.history, acknowledgedDialogueEntryId);
  const caseClosed = isCaseClosed(vnRuntime.history, runtime.simulation);
  const closingCaseId = runtime.selectedCaseId || runtime.activeCaseId;
  const heldDialogueEntryId = nextUnacknowledgedStoryEntry?.id || '';
  const activePlayerRequest = playerLawyer.activeRequest
    && runtime.activeCaseId
    && playerLawyer.activeRequest.caseId === runtime.activeCaseId
    ? playerLawyer.activeRequest
    : null;
  const activePlayerRequestReady = activePlayerRequest
    ? isPlayerRequestReadyForDisplay(
      activePlayerRequest,
      vnRuntime.history,
      latestAcknowledgedStoryEntry,
    )
    : false;
  const visiblePlayerRequest = activePlayerRequestReady && playerDialogMayAutoOpen ? activePlayerRequest : null;
  const casePickerOpen = Boolean(
    auth.backendConfigured
    && auth.user
    && runtime.simulation?.canStart
    && !runtime.activeCaseId
    && !runtime.loading,
  );
  const activeDocumentFollowupCount = visiblePlayerRequest
    ? documentFollowupHistoryByRequestId[visiblePlayerRequest.requestId]?.length || 0
    : 0;
  const finalCaseClosedLineAcknowledged = Boolean(latestAcknowledgedStoryEntry && isCaseClosedEntry(latestAcknowledgedStoryEntry));
  const currentOnboardingStepId = getCurrentOnboardingStepId({
    caseClosed,
    casePickerOpen,
    documentFollowupCount: activeDocumentFollowupCount,
    finalCaseClosedLineAcknowledged,
    nextUnacknowledgedStoryEntryId: nextUnacknowledgedStoryEntry?.id || '',
    visiblePlayerRequestStage: visiblePlayerRequest?.stage || '',
  });
  const currentOnboardingStep = getOnboardingStepById(currentOnboardingStepId);
  const onboardingBlocksPlayerDialog = Boolean(
    currentOnboardingStep?.kind === 'key'
      && !onboarding.isCompleted
      && !onboarding.isStepDismissed(currentOnboardingStep.id),
  );
  const visiblePlayerRequestForDialog = onboardingBlocksPlayerDialog ? null : visiblePlayerRequest;
  const shouldShowOnboardingCoach = Boolean(
    currentOnboardingStep
      && !onboarding.isCompleted
      && !onboarding.isStepDismissed(currentOnboardingStep.id),
  );
  const showUserTaskPanel = Boolean(visiblePlayerRequest || playerLawyer.error);
  const activeDocumentSkill = activePlayerRequest
    ? findDocumentSkillForStage(documentSkills, activePlayerRequest.stage)
    : null;

  useEffect(() => {
    if (!auth.backendConfigured || !auth.user) return;
    let cancelled = false;
    fetchRuntimeTechCatalog()
      .then((catalog) => {
        if (!cancelled) dispatchVnEvent({ type: 'runtime-tech-catalog-loaded', catalog });
      })
      .catch(() => {
        // The panel can still render observed runtime tags when the catalog endpoint is unavailable.
      });
    return () => {
      cancelled = true;
    };
  }, [auth.backendConfigured, auth.user]);

  useEffect(() => {
    if (displayedScene.tech.activeTools.length === 0 && displayedScene.tech.activeSkills.length === 0) return;
    const timeoutId = window.setTimeout(() => {
      dispatchVnEvent({ type: 'clear-runtime-tech-highlight' });
    }, TECH_HIGHLIGHT_DURATION_MS);
    return () => window.clearTimeout(timeoutId);
  }, [
    displayedScene.tech.activeSkills,
    displayedScene.tech.activeTools,
    displayedScene.tech.lastTechEventAt,
  ]);

  useEffect(() => {
    try {
      localStorage.setItem(AUTO_NEXT_STORAGE_KEY, autoNextEnabled ? 'true' : 'false');
    } catch {
      // Ignore private browsing or storage-denied environments.
    }
  }, [autoNextEnabled]);

  useEffect(() => {
    if (!autoNextEnabled) return;
    if (!nextUnacknowledgedStoryEntry) return;
    if (caseClosed || runtime.error || runtime.simulation?.paused || playerDialogOpen) return;
    const timeoutId = window.setTimeout(() => {
      setAcknowledgedDialogueEntryId(nextUnacknowledgedStoryEntry.id);
    }, AUTO_NEXT_ACKNOWLEDGE_DELAY_MS);
    return () => window.clearTimeout(timeoutId);
  }, [
    autoNextEnabled,
    caseClosed,
    nextUnacknowledgedStoryEntry,
    playerDialogOpen,
    runtime.error,
    runtime.simulation?.paused,
  ]);

  useEffect(() => {
    if (!runtime.activeCaseId) {
      if (caseClosed) return;
      setDialogueGate(null);
      setPlayerDialogOpen(false);
      setAutoOpenedPlayerRequestId('');
      setAcknowledgedDialogueEntryId('');
      setClosingSummaryOpen(false);
      setClosingSummaryEntryId('');
    }
  }, [caseClosed, runtime.activeCaseId]);

  useEffect(() => {
    if (!shouldOpenClosingSummary(latestAcknowledgedStoryEntry, caseClosed)) return;
    const entryId = latestAcknowledgedStoryEntry?.id || '';
    if (!entryId || closingSummaryEntryId === entryId) return;
    setClosingSummaryOpen(true);
    setClosingSummaryEntryId(entryId);
  }, [caseClosed, closingSummaryEntryId, latestAcknowledgedStoryEntry]);

  useEffect(() => {
    if (!visiblePlayerRequest?.requestId) return;
    if (autoOpenedPlayerRequestId === visiblePlayerRequest.requestId) return;
    if (!playerDialogMayAutoOpen || onboardingBlocksPlayerDialog) return;
    setPlayerDialogOpen(true);
    setAutoOpenedPlayerRequestId(visiblePlayerRequest.requestId);
  }, [autoOpenedPlayerRequestId, onboardingBlocksPlayerDialog, playerDialogMayAutoOpen, visiblePlayerRequest?.requestId]);

  useEffect(() => {
    if (!activePlayerRequest || !isDocumentStage(activePlayerRequest.stage)) return;
    let cancelled = false;
    fetchPlayerLawyerDocumentSkills()
      .then((skills) => {
        if (!cancelled) setDocumentSkills(skills);
      })
      .catch(() => {
        if (!cancelled) setDocumentSkills([]);
      });
    return () => {
      cancelled = true;
    };
  }, [activePlayerRequest?.requestId, activePlayerRequest?.stage]);

  useEffect(() => {
    if (!auth.backendConfigured || !auth.user) {
      getWebSocketService().disconnect();
      return;
    }

    const eventBus = getEventBus();
    const handlers: Array<[string, (payload?: Record<string, unknown>) => void]> = [
      ['ws:connected', () => dispatchVnEvent({ type: 'ws-connected' })],
      ['ws:disconnected', () => {
        dispatchVnEvent({ type: 'ws-disconnected' });
      }],
      ['ws:dialogue-update', (payload) => {
        setDialogueGate(null);
        dispatchVnEvent({ type: 'dialogue-update', payload });
      }],
      ['ws:dialogue-gate-waiting', (payload) => {
        void autoContinueDialogueGate(payload);
        dispatchVnEvent({ type: 'dialogue-gate-waiting', payload });
      }],
      ['ws:dialogue-gate-accepted', (payload) => {
        const gateId = String(payload?.gate_id || '');
        setDialogueGate((current) => (current?.gateId === gateId ? null : current));
        dispatchVnEvent({ type: 'dialogue-gate-accepted', payload });
      }],
      ['ws:dialogue-gate-error', (payload) => {
        setDialogueGate(null);
        dispatchVnEvent({ type: 'dialogue-gate-error', payload });
      }],
      ['ws:runtime-progress', (payload) => {
        if (shouldClearDialogueGateAfterRuntimeProgress(payload)) {
          setDialogueGate(null);
        }
        dispatchVnEvent({ type: 'runtime-progress', payload });
      }],
      ['ws:step-gate-waiting', (payload) => dispatchVnEvent({ type: 'step-gate-waiting', payload })],
      ['ws:step-gate-accepted', (payload) => dispatchVnEvent({ type: 'step-gate-accepted', payload })],
      ['ws:step-gate-error', (payload) => dispatchVnEvent({ type: 'step-gate-error', payload })],
      ['ws:case-state-change', (payload) => {
        setDialogueGate(null);
        dispatchVnEvent({ type: 'case-state-change', payload });
      }],
      ['ws:scenario-start', (payload) => {
        setDialogueGate(null);
        dispatchVnEvent({ type: 'scenario-start', payload });
      }],
      ['ws:scenario-end', (payload) => {
        setDialogueGate(null);
        dispatchVnEvent({ type: 'scenario-end', payload });
      }],
      ['ws:case-runtime-issue', (payload) => dispatchVnEvent({ type: 'case-runtime-issue', payload })],
      ['ws:player-lawyer-input-required', (payload) => {
        setDialogueGate(null);
        dispatchVnEvent({ type: 'player-lawyer-input-required', payload });
      }],
      ['ws:player-lawyer-input-submitted', (payload) => {
        setDialogueGate(null);
        dispatchVnEvent({ type: 'player-lawyer-input-submitted', payload });
      }],
      ['ws:player-lawyer-document-draft-ready', (payload) => dispatchVnEvent({ type: 'player-lawyer-document-draft-ready', payload })],
      ['ws:player-lawyer-document-confirmed', (payload) => {
        setDialogueGate(null);
        dispatchVnEvent({ type: 'player-lawyer-document-confirmed', payload });
      }],
      ['ws:player-lawyer-error', (payload) => dispatchVnEvent({ type: 'player-lawyer-error', payload })],
      ['ws:error', (payload) => dispatchVnEvent({ type: 'ws-error', payload })],
      ['ws:unknown', (payload) => dispatchVnEvent({ type: 'ws-unknown', payload })],
    ];

    handlers.forEach(([event, handler]) => eventBus.on(event, handler));
    void getWebSocketService().connect();

    return () => {
      handlers.forEach(([event, handler]) => eventBus.off(event, handler));
      getWebSocketService().disconnect();
    };
  }, [auth.backendConfigured, auth.user]);

  async function handleStartSelectedCase(caseId?: string): Promise<void> {
    setDialogueGate(null);
    setPlayerDialogOpen(false);
    setAutoOpenedPlayerRequestId('');
    setAcknowledgedDialogueEntryId('');
    setClosingSummaryOpen(false);
    setClosingSummaryEntryId('');
    await runtime.startSelectedCase(caseId);
  }

  async function handleRestartSimulation(): Promise<void> {
    setDialogueGate(null);
    setPlayerDialogOpen(false);
    setAutoOpenedPlayerRequestId('');
    setAcknowledgedDialogueEntryId('');
    setClosingSummaryOpen(false);
    setClosingSummaryEntryId('');
    await runtime.restart();
    dispatchVnEvent({ type: 'runtime-reset' });
  }

  async function handleManualDocumentSubmit(input: { documentText: string }): Promise<void> {
    const request = playerLawyer.activeRequest;
    if (!request) {
      throw new Error('当前没有待处理的文书任务');
    }
    const stage = String(request.stage || '').toUpperCase();
    const documentType = STAGE_DOCUMENT_TYPES[stage];
    if (!documentType) {
      throw new Error('当前任务不是可提交的文书阶段');
    }
    await confirmManualPlayerLawyerDocument({
      caseId: request.caseId,
      documentType,
      documentText: input.documentText.trim(),
      requestId: request.requestId,
    });
    await playerLawyer.refresh();
    setDialogueGate(null);
    dispatchVnEvent({
      type: 'player-lawyer-document-confirmed',
      payload: { message: `${documentType} 文书已由用户提交并确认。` },
    });
    setPlayerDialogOpen(false);
  }

  async function handleDocumentPolish(input: { documentText: string; followupHistory?: Array<{ question: string; answer: string }> }): Promise<string> {
    const request = playerLawyer.activeRequest;
    if (!request) {
      throw new Error('当前没有待处理的文书任务');
    }
    const stage = String(request.stage || '').toUpperCase();
    const documentType = STAGE_DOCUMENT_TYPES[stage];
    if (!documentType) {
      throw new Error('当前任务不是可润色的文书阶段');
    }
    const documentSkill = findDocumentSkillForStage(documentSkills, request.stage);
    if (!documentSkill?.skillId) {
      throw new Error('当前文书规则尚未读取完成，请稍后再试');
    }
    setDocumentPolishLoading(true);
    try {
      const followupContext = (input.followupHistory || [])
        .map((item, index) => `追问${index + 1}：${item.question}\n当事人回答${index + 1}：${item.answer}`)
        .join('\n\n');
      const draft = await createPlayerLawyerDocumentDraft({
        caseId: request.caseId,
        documentType,
        skillId: documentSkill.skillId,
        playerPrompt: `${String(request.prompt || '').trim()}${followupContext ? `\n\n【文书阶段追问记录】\n${followupContext}` : ''}\n\n请只润色当前草稿，不新增无来源事实、金额、日期、证据或主体信息。`,
        playerDraft: input.documentText,
        requestId: request.requestId,
      });
      return draft.documentText;
    } finally {
      setDocumentPolishLoading(false);
    }
  }

  function handleOnboardingCoachConfirm() {
    if (!currentOnboardingStep) return;
    onboarding.markStepDismissed(currentOnboardingStep.id);
    if (currentOnboardingStep.id === 'closing-score') {
      onboarding.completeOnboarding();
      setClosingSummaryOpen(true);
      return;
    }
    if (visiblePlayerRequest && currentOnboardingStep.kind === 'key') {
      setPlayerDialogOpen(true);
    }
  }

  function handleOnboardingCoachDismiss() {
    if (!currentOnboardingStep) return;
    onboarding.markStepDismissed(currentOnboardingStep.id);
  }

  async function handleDocumentFollowup(input: { message: string }): Promise<{ question: string; answer: string }> {
    const request = playerLawyer.activeRequest;
    if (!request) {
      throw new Error('当前没有待处理的文书任务');
    }
    if (!STAGE_DOCUMENT_TYPES[String(request.stage || '').toUpperCase()]) {
      throw new Error('当前任务不是可追问的文书阶段');
    }
    setDocumentFollowupLoading(true);
    try {
      const result = await sendPlayerLawyerDocumentFollowup({
        requestId: request.requestId,
        message: input.message.trim(),
      });
      const followup = {
        question: result.question || input.message.trim(),
        answer: result.answer || '当事人暂未补充更多信息。',
      };
      setDocumentFollowupHistoryByRequestId((current) => ({
        ...current,
        [request.requestId]: [
          ...(current[request.requestId] || []),
          followup,
        ],
      }));
      await playerLawyer.refresh();
      return followup;
    } finally {
      setDocumentFollowupLoading(false);
    }
  }

  return (
    <main className="app-shell">
      <CommandHud
        autoNextEnabled={autoNextEnabled}
        backendConfigured={auth.backendConfigured}
        canOpenClosingSummary={Boolean(caseClosed && closingCaseId)}
        loading={runtime.loading}
        onAutoNextChange={setAutoNextEnabled}
        onLogout={auth.user ? auth.onLogout : undefined}
        onOpenClosingSummary={() => setClosingSummaryOpen(true)}
        onOpenDocuments={() => setDocumentsOpen(true)}
        onOpenOnboardingGuide={onboarding.openGuide}
        onRestart={() => setRestartConfirmOpen(true)}
        onResumeCurrentCase={runtime.activeCaseId ? handleStartSelectedCase : undefined}
        runtimeError={runtime.error}
        runtimeStatus={vnRuntime.runtimeStatus}
        simulation={runtime.simulation}
        user={auth.user}
        wsConnected={vnRuntime.wsConnected}
      />
      {visiblePlayerRequest && !playerDialogOpen && !onboardingBlocksPlayerDialog && (
        <section className="user-task-recovery-banner" aria-label="当前流程等待用户处理">
          <div>
            <strong>当前流程正在等待你处理用户任务</strong>
            <span>
              刷新或重新连接后，案件会停在这个节点，不是系统卡住，也不需要先重置。请继续处理当前角色任务。
            </span>
          </div>
          <button
            className="primary-action"
            disabled={playerLawyer.actionLoading}
            onClick={() => setPlayerDialogOpen(true)}
            type="button"
          >
            {isDocumentStage(visiblePlayerRequest.stage) ? '继续文书' : '继续处理'}
          </button>
        </section>
      )}
      {casePickerOpen && (
        <CasePicker
          cases={runtime.cases}
          disabled={!auth.user}
          error={runtime.error}
          loading={runtime.loading}
          onRefresh={runtime.refresh}
          onSelect={runtime.selectCase}
          onStart={handleStartSelectedCase}
          selectedCaseId={runtime.selectedCaseId}
        />
      )}
      <div className="vn-layout">
        <div className="side-rail">
          {showUserTaskPanel && (
            <PlayerLawyerTaskPanel
              activeRequest={visiblePlayerRequest}
              error={playerLawyer.error}
              loading={playerLawyer.actionLoading}
              onOpenRequest={() => {
                if (!onboardingBlocksPlayerDialog) setPlayerDialogOpen(true);
              }}
              simulation={runtime.simulation}
              status={playerLawyer.status}
            />
          )}
          <TechLedger background={vnRuntime.background} scene={displayedScene} />
        </div>
        <div className="story-surface">
          <VisualNovelStage scene={displayedScene} />
          <div className="dialogue-dock">
            <DialogueBox
              backendMode={auth.backendConfigured && Boolean(auth.user)}
              caseClosed={caseClosed}
              hasPendingUserTask={Boolean(visiblePlayerRequest)}
              heldDialogueEntryId={heldDialogueEntryId}
              history={vnRuntime.history}
              lastAcknowledgedEntry={latestAcknowledgedStoryEntry}
              onAcknowledgeCurrentEntry={(entry) => {
                setAcknowledgedDialogueEntryId(entry.id);
              }}
              onResumeCurrentCase={runtime.activeCaseId ? handleStartSelectedCase : undefined}
              runtimeError={runtime.error}
              runtimeStatus={vnRuntime.runtimeStatus}
              scene={displayedScene}
              selectedCaseId={runtime.selectedCaseId}
              simulation={runtime.simulation}
              wsConnected={vnRuntime.wsConnected}
            />
            <TownRadar radar={townRadar} scene={displayedScene} />
          </div>
        </div>
      </div>
      <PlayerLawyerInputDialog
        documentSkill={activeDocumentSkill}
        initialFollowupHistory={activePlayerRequest ? documentFollowupHistoryByRequestId[activePlayerRequest.requestId] || [] : []}
        loading={playerLawyer.actionLoading || documentPolishLoading || documentFollowupLoading}
        onClose={() => setPlayerDialogOpen(false)}
        onFollowupDocument={handleDocumentFollowup}
        onPolishDocument={handleDocumentPolish}
        onPolishText={async (input) => {
          const assist = await playerLawyer.polishTextReply(input);
          return assist.aiPolishedMessage;
        }}
        onSubmitDocument={handleManualDocumentSubmit}
        onSubmitText={async (input) => {
          await playerLawyer.submitTextReply(input);
          setDialogueGate(null);
          dispatchVnEvent({
            type: 'player-lawyer-input-submitted',
            payload: { message: input.finalMessage || input.message },
          });
          setPlayerDialogOpen(false);
        }}
        request={playerDialogOpen ? visiblePlayerRequestForDialog : null}
      />
      <CaseTimeline
        activeCode={displayedScene.stageCode}
        activeEntry={nextUnacknowledgedStoryEntry}
        backendMode={auth.backendConfigured && Boolean(auth.user)}
        history={vnRuntime.history}
        playerPlaintiffPerspective={playerLawyer.status?.enabled && playerLawyer.status?.playerMode === 'plaintiff'}
      />
      <CaseDocumentsPanel
        caseId={runtime.selectedCaseId || playerLawyer.activeRequest?.caseId || ''}
        onClose={() => setDocumentsOpen(false)}
        open={documentsOpen}
      />
      <CaseClosingSummaryDialog
        open={closingSummaryOpen}
        caseId={closingCaseId}
        onClose={() => setClosingSummaryOpen(false)}
      />
      <OnboardingGuideDialog
        currentStepId={currentOnboardingStepId}
        open={onboarding.guideOpen}
        onClose={() => onboarding.setGuideOpen(false)}
        onReset={onboarding.resetOnboarding}
      />
      {shouldShowOnboardingCoach && (
        <OnboardingCoach
          step={currentOnboardingStep}
          onConfirm={handleOnboardingCoachConfirm}
          onDismiss={handleOnboardingCoachDismiss}
          onOpenGuide={onboarding.openGuide}
        />
      )}
      {restartConfirmOpen && (
        <div className="modal-layer" role="dialog" aria-modal="true" aria-label="确认重置模拟">
          <section className="confirm-dialog">
            <div className="panel-kicker">Reset Case Run</div>
            <h2>确认重置模拟？</h2>
            <p>重置会停止当前案件运行，并回到可重新选择案件的状态。已生成的案件进度会按当前重置规则处理。</p>
            <div className="confirm-dialog-actions">
              <button
                className="secondary-action"
                disabled={runtime.loading}
                onClick={() => setRestartConfirmOpen(false)}
                type="button"
              >
                取消
              </button>
              <button
                className="primary-action"
                disabled={runtime.loading}
                onClick={async () => {
                  await handleRestartSimulation();
                  setRestartConfirmOpen(false);
                }}
                type="button"
              >
                {runtime.loading ? '重置中' : '确认重置'}
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}

export function App() {
  return (
    <>
      <AuthGate>{(auth) => <AppShell auth={auth} />}</AuthGate>
      <BuildVersionBadge />
    </>
  );
}

function getNextUnacknowledgedStoryEntry(
  history: DialogueHistoryEntry[],
  acknowledgedDialogueEntryId: string,
): DialogueHistoryEntry | null {
  const acknowledgedIndex = acknowledgedDialogueEntryId
    ? history.findIndex((entry) => entry.id === acknowledgedDialogueEntryId)
    : -1;
  const startIndex = acknowledgedIndex >= 0 ? acknowledgedIndex + 1 : 0;
  for (let index = startIndex; index < history.length; index += 1) {
    const entry = history[index];
    if (entry.kind === 'dialogue' || isNarrativeSystemEntry(entry)) {
      return entry;
    }
  }
  return null;
}

function getLatestAcknowledgedStoryEntry(
  history: DialogueHistoryEntry[],
  acknowledgedDialogueEntryId: string,
): DialogueHistoryEntry | null {
  if (!acknowledgedDialogueEntryId) return null;
  const entry = history.find((item) => item.id === acknowledgedDialogueEntryId);
  if (!entry || (entry.kind !== 'dialogue' && !isNarrativeSystemEntry(entry))) return null;
  return entry;
}

function isPlayerRequestReadyForDisplay(
  request: NonNullable<ReturnType<typeof usePlayerLawyerRuntime>['activeRequest']>,
  history: DialogueHistoryEntry[],
  latestAcknowledgedStoryEntry: DialogueHistoryEntry | null,
): boolean {
  if (isDocumentStage(request.stage)) return true;
  const requestPrompt = normalizeDialogueText(request.prompt);
  if (!requestPrompt || !latestAcknowledgedStoryEntry) return false;

  const latestAcknowledgedIndex = history.findIndex((entry) => entry.id === latestAcknowledgedStoryEntry.id);
  if (latestAcknowledgedIndex < 0) return false;

  const acknowledgedPromptIndex = history.findIndex((entry) => (
    entry.kind === 'dialogue'
    && dialogueTextMatchesRequestPrompt(entry.text, requestPrompt)
  ));
  return acknowledgedPromptIndex >= 0 && acknowledgedPromptIndex <= latestAcknowledgedIndex;
}

function dialogueTextMatchesRequestPrompt(entryText: string, requestPrompt: string): boolean {
  const normalizedEntry = normalizeDialogueText(entryText);
  return normalizedEntry === requestPrompt
    || normalizedEntry.includes(requestPrompt)
    || requestPrompt.includes(normalizedEntry);
}

function normalizeDialogueText(text: string): string {
  return String(text || '').replace(/\s+/g, '').trim();
}

function isNarrativeSystemEntry(entry: DialogueHistoryEntry): boolean {
  if (entry.kind !== 'system') return false;
  return !isOperationalContinueNotice(entry.text);
}

function isCaseClosed(
  history: DialogueHistoryEntry[],
  simulation: SimulationStatus | null,
): boolean {
  return history.some(isCaseClosedEntry)
    || simulation?.status === 'completed'
    || simulation?.status === 'closed';
}

function isCaseClosedEntry(entry: DialogueHistoryEntry): boolean {
  return entry.kind === 'system' && entry.text.includes('本案已结案');
}

function shouldOpenClosingSummary(
  acknowledgedEntry: DialogueHistoryEntry | null,
  caseClosed: boolean,
): boolean {
  return Boolean(caseClosed
    && acknowledgedEntry
    && isCaseClosedEntry(acknowledgedEntry)
  );
}

function isOperationalContinueNotice(text: string): boolean {
  return text.includes('已请求继续生成下一句')
    || text.includes('已收到继续请求');
}

function readAutoNextPreference(): boolean {
  try {
    return localStorage.getItem(AUTO_NEXT_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

function isDocumentStage(stage?: string): boolean {
  return ['CD', 'DD', 'AD', 'AR'].includes(String(stage || '').toUpperCase());
}

function findDocumentSkillForStage(skills: PlayerLawyerSkill[], stage?: string): PlayerLawyerSkill | null {
  const documentType = STAGE_DOCUMENT_TYPES[String(stage || '').toUpperCase()];
  if (!documentType) return null;
  const normalizedDocumentType = {
    CD: 'complaint',
    DD: 'defense',
    AD: 'appeal',
    AR: 'appeal_response',
  }[documentType];
  return skills.find((skill) => skill.documentType === normalizedDocumentType) || null;
}

function shouldClearDialogueGateAfterRuntimeProgress(payload?: Record<string, unknown>): boolean {
  const phase = String(payload?.phase || '').trim();
  return Boolean(phase && phase !== 'next_ready');
}

async function autoContinueDialogueGate(payload?: Record<string, unknown>): Promise<void> {
  const gateId = String(payload?.gate_id || '');
  if (!gateId) return;
  await getWebSocketService().sendDialogueContinue(gateId);
}
