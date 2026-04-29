import { useEffect, useReducer, useState } from 'react';
import { AuthGate, type AuthGateState } from './components/AuthGate';
import { BuildVersionBadge } from './components/BuildVersionBadge';
import { CasePicker } from './components/CasePicker';
import { CaseDocumentsPanel } from './components/CaseDocumentsPanel';
import { CaseTimeline } from './components/CaseTimeline';
import { CommandHud } from './components/CommandHud';
import { DialogueBox } from './components/DialogueBox';
import { PlayerLawyerInputDialog } from './components/PlayerLawyerInputDialog';
import { PlayerLawyerTaskPanel } from './components/PlayerLawyerTaskPanel';
import { TechLedger } from './components/TechLedger';
import { VisualNovelStage } from './components/VisualNovelStage';
import { getEventBus } from './services/eventBus';
import {
  confirmPlayerLawyerDocumentDraft,
  createPlayerLawyerDocumentDraft,
  fetchPlayerLawyerDocumentSkills,
} from './services/playerLawyerApi';
import { getWebSocketService } from './services/webSocket';
import { usePlayerLawyerRuntime } from './state/usePlayerLawyerRuntime';
import { useSimulationRuntime } from './state/useSimulationRuntime';
import {
  createInitialVnRuntimeState,
  createSceneForHistoryEntry,
  vnEventReducer,
  type DialogueHistoryEntry,
} from './state/vnEventReducer';

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

const DIALOGUE_CONTINUE_TIMEOUT_MS = 12000;

const STAGE_DOCUMENT_TYPES: Record<string, string> = {
  CD: 'CD',
  DD: 'DD',
  AD: 'AD',
  AR: 'AR',
};

const STAGE_SKILL_IDS: Record<string, string> = {
  CD: 'lawyer-complaint-drafting',
  DD: 'lawyer-defense-drafting',
  AD: 'lawyer-appeal-drafting',
  AR: 'lawyer-appeal-response-drafting',
};

function AppShell({ auth }: AppShellProps) {
  const [documentsOpen, setDocumentsOpen] = useState(false);
  const [dialogueGate, setDialogueGate] = useState<DialogueGateState>(null);
  const [playerDialogOpen, setPlayerDialogOpen] = useState(false);
  const [autoOpenedPlayerRequestId, setAutoOpenedPlayerRequestId] = useState('');
  const [acknowledgedDialogueEntryId, setAcknowledgedDialogueEntryId] = useState('');
  const [restartConfirmOpen, setRestartConfirmOpen] = useState(false);
  const runtime = useSimulationRuntime(auth.backendConfigured && Boolean(auth.user));
  const playerLawyer = usePlayerLawyerRuntime(
    auth.backendConfigured && Boolean(auth.user) && Boolean(runtime.activeCaseId),
    runtime.activeCaseId,
  );
  const [vnRuntime, dispatchVnEvent] = useReducer(vnEventReducer, undefined, createInitialVnRuntimeState);
  const scene = vnRuntime.scene;
  const nextUnacknowledgedStoryEntry = getNextUnacknowledgedStoryEntry(vnRuntime.history, acknowledgedDialogueEntryId);
  const displayedScene = nextUnacknowledgedStoryEntry
    ? createSceneForHistoryEntry(scene, nextUnacknowledgedStoryEntry)
    : scene;
  const playerDialogMayAutoOpen = !nextUnacknowledgedStoryEntry;
  const latestAcknowledgedStoryEntry = getLatestAcknowledgedStoryEntry(vnRuntime.history, acknowledgedDialogueEntryId);
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
  const showUserTaskPanel = Boolean(visiblePlayerRequest || playerLawyer.error);
  const casePickerOpen = Boolean(
    auth.backendConfigured
    && auth.user
    && runtime.simulation?.canStart
    && !runtime.activeCaseId
    && !runtime.loading,
  );

  useEffect(() => {
    if (!runtime.activeCaseId) {
      setDialogueGate(null);
      setPlayerDialogOpen(false);
      setAutoOpenedPlayerRequestId('');
      setAcknowledgedDialogueEntryId('');
    }
  }, [runtime.activeCaseId]);

  useEffect(() => {
    if (!visiblePlayerRequest?.requestId) return;
    if (autoOpenedPlayerRequestId === visiblePlayerRequest.requestId) return;
    if (!playerDialogMayAutoOpen) return;
    setPlayerDialogOpen(true);
    setAutoOpenedPlayerRequestId(visiblePlayerRequest.requestId);
  }, [autoOpenedPlayerRequestId, playerDialogMayAutoOpen, visiblePlayerRequest?.requestId]);

  useEffect(() => {
    if (!dialogueGate?.gateId || !dialogueGate.pending) return;
    const gateId = dialogueGate.gateId;
    const timer = setTimeout(() => {
      setDialogueGate((current) => (
        current?.gateId === gateId && current.pending
          ? { ...current, pending: false }
          : current
      ));
      dispatchVnEvent({
        type: 'ws-error',
        payload: { message: '案件流程超过 12 秒还没有响应，请重新点击继续，或查看顶部连接状态。' },
      });
    }, DIALOGUE_CONTINUE_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [dialogueGate?.gateId, dialogueGate?.pending]);

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
        const gateId = String(payload?.gate_id || '');
        if (!gateId) return;
        setDialogueGate({
          gateId,
          pending: false,
          speakerName: String(payload?.speaker_name || ''),
          turn: Number(payload?.turn || 0),
        });
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

  async function handleDialogueContinue(): Promise<void> {
    if (!dialogueGate?.gateId) return;
    if (dialogueGate.pending) return;
    const gateId = dialogueGate.gateId;
    setDialogueGate((current) => (
      current?.gateId === gateId ? { ...current, pending: true, requestedAt: Date.now() } : current
    ));
    const sent = await getWebSocketService().sendDialogueContinue(gateId);
    if (sent) {
      dispatchVnEvent({
        type: 'dialogue-continue-sent',
        payload: { gate_id: gateId },
      });
    } else {
      setDialogueGate((current) => (
        current?.gateId === gateId ? { ...current, pending: false } : current
      ));
    }
  }

  async function handleStartSelectedCase(caseId?: string): Promise<void> {
    setDialogueGate(null);
    setPlayerDialogOpen(false);
    setAutoOpenedPlayerRequestId('');
    setAcknowledgedDialogueEntryId('');
    await runtime.startSelectedCase(caseId);
  }

  async function handleRestartSimulation(): Promise<void> {
    setDialogueGate(null);
    setPlayerDialogOpen(false);
    setAutoOpenedPlayerRequestId('');
    setAcknowledgedDialogueEntryId('');
    await runtime.restart();
    dispatchVnEvent({ type: 'runtime-reset' });
  }

  async function handleAutoDocumentSubmit(input: { playerDraft?: string } = {}): Promise<void> {
    const request = playerLawyer.activeRequest;
    if (!request) {
      throw new Error('当前没有待处理的文书任务');
    }
    const stage = String(request.stage || '').toUpperCase();
    const documentType = STAGE_DOCUMENT_TYPES[stage];
    if (!documentType) {
      throw new Error('当前任务不是可自动完成的文书阶段');
    }
    const skills = await fetchPlayerLawyerDocumentSkills();
    const preferredSkillId = STAGE_SKILL_IDS[stage];
    const selectedSkillId = (
      skills.find((skill) => skill.skillId === preferredSkillId)?.skillId
      || skills[0]?.skillId
      || ''
    );
    if (!selectedSkillId) {
      throw new Error('没有可用的文书规则');
    }
    const draft = await createPlayerLawyerDocumentDraft({
      caseId: request.caseId,
      documentType,
      skillId: selectedSkillId,
      playerPrompt: request.prompt,
      playerDraft: input.playerDraft || '',
      requestId: request.requestId,
    });
    if (!draft.documentText.trim()) {
      throw new Error('AI 生成的文书为空');
    }
    await confirmPlayerLawyerDocumentDraft({
      draftId: draft.draftId,
      documentText: draft.documentText.trim(),
    });
    await playerLawyer.refresh();
    setDialogueGate(null);
    dispatchVnEvent({
      type: 'player-lawyer-document-confirmed',
      payload: { message: `${documentType} 文书已由 AI 生成并确认。` },
    });
    setPlayerDialogOpen(false);
  }

  return (
    <main className="app-shell">
      <CommandHud
        backendConfigured={auth.backendConfigured}
        loading={runtime.loading}
        onLogout={auth.user ? auth.onLogout : undefined}
        onOpenDocuments={() => setDocumentsOpen(true)}
        onRestart={() => setRestartConfirmOpen(true)}
        onResumeCurrentCase={runtime.activeCaseId ? handleStartSelectedCase : undefined}
        runtimeError={runtime.error}
        runtimeStatus={vnRuntime.runtimeStatus}
        simulation={runtime.simulation}
        user={auth.user}
        wsConnected={vnRuntime.wsConnected}
      />
      {visiblePlayerRequest && !playerDialogOpen && (
        <section className="user-task-recovery-banner" aria-label="当前流程等待用户处理">
          <div>
            <strong>当前流程正在等待你处理用户任务</strong>
            <span>
              刷新或重新连接后，案件会停在这个节点，不是系统卡住，也不需要先重置。请继续处理当前角色任务。
            </span>
          </div>
          <button className="primary-action" disabled={playerLawyer.actionLoading} onClick={() => setPlayerDialogOpen(true)} type="button">
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
              onOpenRequest={() => setPlayerDialogOpen(true)}
              simulation={runtime.simulation}
              status={playerLawyer.status}
            />
          )}
          <TechLedger background={vnRuntime.background} scene={displayedScene} />
        </div>
        <div className="story-surface">
          <VisualNovelStage scene={displayedScene} />
          <DialogueBox
            backendMode={auth.backendConfigured && Boolean(auth.user)}
            dialogueGate={dialogueGate}
            heldDialogueEntryId={heldDialogueEntryId}
            history={vnRuntime.history}
            onAcknowledgeCurrentEntry={(entry) => {
              setAcknowledgedDialogueEntryId(entry.id);
            }}
            onContinueDialogue={handleDialogueContinue}
            onResumeCurrentCase={runtime.activeCaseId ? handleStartSelectedCase : undefined}
            runtimeError={runtime.error}
            scene={displayedScene}
            selectedCaseId={runtime.selectedCaseId}
            simulation={runtime.simulation}
            wsConnected={vnRuntime.wsConnected}
          />
        </div>
      </div>
      <PlayerLawyerInputDialog
        loading={playerLawyer.actionLoading}
        onAutoDocumentSubmit={handleAutoDocumentSubmit}
        onClose={() => setPlayerDialogOpen(false)}
        onDraftText={async (input) => {
          const assist = await playerLawyer.draftTextReply(input);
          return assist.aiPolishedMessage;
        }}
        onPolishText={async (input) => {
          const assist = await playerLawyer.polishTextReply(input);
          return assist.aiPolishedMessage;
        }}
        onSubmitText={async (input) => {
          await playerLawyer.submitTextReply(input);
          setDialogueGate(null);
          dispatchVnEvent({
            type: 'player-lawyer-input-submitted',
            payload: { message: input.finalMessage || input.message },
          });
          setPlayerDialogOpen(false);
        }}
        request={playerDialogOpen ? visiblePlayerRequest : null}
      />
      <CaseTimeline
        activeCode={displayedScene.stageCode}
        activeEntry={nextUnacknowledgedStoryEntry}
        backendMode={auth.backendConfigured && Boolean(auth.user)}
        history={vnRuntime.history}
      />
      <CaseDocumentsPanel
        caseId={runtime.selectedCaseId || playerLawyer.activeRequest?.caseId || ''}
        onClose={() => setDocumentsOpen(false)}
        open={documentsOpen}
      />
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
  return !(
    entry.text.includes('已请求继续生成下一句')
    || entry.text.includes('已收到继续请求')
  );
}

function isDocumentStage(stage?: string): boolean {
  return ['CD', 'DD', 'AD', 'AR'].includes(String(stage || '').toUpperCase());
}

function shouldClearDialogueGateAfterRuntimeProgress(payload?: Record<string, unknown>): boolean {
  const phase = String(payload?.phase || '').trim();
  return Boolean(phase && phase !== 'next_ready');
}
