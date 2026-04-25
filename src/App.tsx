import { useEffect, useReducer, useState } from 'react';
import { AuthGate, type AuthGateState } from './components/AuthGate';
import { CasePicker } from './components/CasePicker';
import { CaseDocumentsPanel } from './components/CaseDocumentsPanel';
import { CaseTimeline } from './components/CaseTimeline';
import { CommandHud } from './components/CommandHud';
import { DialogueBox } from './components/DialogueBox';
import { DocumentWorkbench } from './components/DocumentWorkbench';
import { PlayerLawyerInputDialog } from './components/PlayerLawyerInputDialog';
import { PlayerLawyerTaskPanel } from './components/PlayerLawyerTaskPanel';
import { TechLedger } from './components/TechLedger';
import { VisualNovelStage } from './components/VisualNovelStage';
import { scenes } from './data/demo';
import { getEventBus } from './services/eventBus';
import { getWebSocketService } from './services/webSocket';
import { usePlayerLawyerRuntime } from './state/usePlayerLawyerRuntime';
import { useSimulationRuntime } from './state/useSimulationRuntime';
import { createInitialVnRuntimeState, vnEventReducer } from './state/vnEventReducer';

type AppShellProps = {
  auth: AuthGateState;
};

type DialogueGateState = {
  gateId: string;
  pending: boolean;
  speakerName: string;
  turn: number;
} | null;

function AppShell({ auth }: AppShellProps) {
  const [documentOpen, setDocumentOpen] = useState(false);
  const [documentsOpen, setDocumentsOpen] = useState(false);
  const [dialogueGate, setDialogueGate] = useState<DialogueGateState>(null);
  const [playerDialogOpen, setPlayerDialogOpen] = useState(false);
  const [restartConfirmOpen, setRestartConfirmOpen] = useState(false);
  const [sceneIndex, setSceneIndex] = useState(0);
  const runtime = useSimulationRuntime(auth.backendConfigured && Boolean(auth.user));
  const playerLawyer = usePlayerLawyerRuntime(
    auth.backendConfigured && Boolean(auth.user),
    runtime.selectedCaseId,
  );
  const [vnRuntime, dispatchVnEvent] = useReducer(vnEventReducer, undefined, createInitialVnRuntimeState);
  const scene = auth.backendConfigured && auth.user ? vnRuntime.scene : scenes[sceneIndex];
  const casePickerOpen = Boolean(
    auth.backendConfigured
    && auth.user
    && runtime.simulation?.canStart
    && !runtime.activeCaseId
    && !runtime.loading,
  );

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
      ['ws:dialogue-update', (payload) => dispatchVnEvent({ type: 'dialogue-update', payload })],
      ['ws:dialogue-gate-waiting', (payload) => {
        const gateId = String(payload?.gate_id || '');
        if (!gateId) return;
        setDialogueGate({
          gateId,
          pending: false,
          speakerName: String(payload?.speaker_name || ''),
          turn: Number(payload?.turn || 0),
        });
      }],
      ['ws:dialogue-gate-accepted', (payload) => {
        const gateId = String(payload?.gate_id || '');
        setDialogueGate((current) => (current?.gateId === gateId ? null : current));
        dispatchVnEvent({ type: 'dialogue-gate-accepted', payload });
      }],
      ['ws:dialogue-gate-error', (payload) => {
        dispatchVnEvent({ type: 'dialogue-gate-error', payload });
      }],
      ['ws:case-state-change', (payload) => dispatchVnEvent({ type: 'case-state-change', payload })],
      ['ws:scenario-start', (payload) => dispatchVnEvent({ type: 'scenario-start', payload })],
      ['ws:scenario-end', (payload) => dispatchVnEvent({ type: 'scenario-end', payload })],
      ['ws:case-runtime-issue', (payload) => dispatchVnEvent({ type: 'case-runtime-issue', payload })],
      ['ws:player-lawyer-input-required', (payload) => {
        setDialogueGate(null);
        dispatchVnEvent({ type: 'player-lawyer-input-required', payload });
      }],
      ['ws:player-lawyer-input-submitted', (payload) => dispatchVnEvent({ type: 'player-lawyer-input-submitted', payload })],
      ['ws:player-lawyer-document-draft-ready', (payload) => dispatchVnEvent({ type: 'player-lawyer-document-draft-ready', payload })],
      ['ws:player-lawyer-document-confirmed', (payload) => dispatchVnEvent({ type: 'player-lawyer-document-confirmed', payload })],
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

  function handleAction(action: string): void {
    if (action.includes('文书') || action.includes('Skill')) {
      setDocumentOpen(true);
      return;
    }
    setSceneIndex((current) => (current + 1) % scenes.length);
  }

  async function handleDialogueContinue(): Promise<void> {
    if (!dialogueGate?.gateId) return;
    setDialogueGate((current) => (
      current?.gateId === dialogueGate.gateId ? { ...current, pending: true } : current
    ));
    const sent = await getWebSocketService().sendDialogueContinue(dialogueGate.gateId);
    if (sent) {
      dispatchVnEvent({
        type: 'dialogue-continue-sent',
        payload: { gate_id: dialogueGate.gateId },
      });
    } else {
      setDialogueGate((current) => (
        current?.gateId === dialogueGate.gateId ? { ...current, pending: false } : current
      ));
    }
  }

  return (
    <main className="app-shell">
      <CommandHud
        backendConfigured={auth.backendConfigured}
        loading={runtime.loading}
        onLogout={auth.user ? auth.onLogout : undefined}
        onOpenDocuments={() => setDocumentsOpen(true)}
        onPause={runtime.pause}
        onRefresh={runtime.refresh}
        onRestart={() => setRestartConfirmOpen(true)}
        onResumeCurrentCase={runtime.activeCaseId ? runtime.startSelectedCase : undefined}
        scene={scene}
        simulation={runtime.simulation}
        user={auth.user}
        wsConnected={vnRuntime.wsConnected}
      />
      {casePickerOpen && (
        <CasePicker
          cases={runtime.cases}
          disabled={!auth.user}
          error={runtime.error}
          loading={runtime.loading}
          onRefresh={runtime.refresh}
          onSelect={runtime.selectCase}
          onStart={runtime.startSelectedCase}
          selectedCaseId={runtime.selectedCaseId}
        />
      )}
      <div className="vn-layout">
        <div className="side-rail">
          <PlayerLawyerTaskPanel
            activeRequest={playerLawyer.activeRequest}
            error={playerLawyer.error}
            loading={playerLawyer.loading}
            onOpenRequest={() => setPlayerDialogOpen(true)}
            status={playerLawyer.status}
          />
          <TechLedger background={vnRuntime.background} scene={scene} />
        </div>
        <div className="story-surface">
          <VisualNovelStage scene={scene} />
          <DialogueBox
            backendMode={auth.backendConfigured && Boolean(auth.user)}
            dialogueGate={dialogueGate}
            history={vnRuntime.history}
            onAction={handleAction}
            onContinueDialogue={handleDialogueContinue}
            onOpenPlayerInput={() => setPlayerDialogOpen(true)}
            pendingRequest={playerLawyer.activeRequest}
            scene={scene}
            wsConnected={vnRuntime.wsConnected}
          />
        </div>
      </div>
      <PlayerLawyerInputDialog
        loading={playerLawyer.loading}
        onClose={() => setPlayerDialogOpen(false)}
        onOpenDocumentWorkbench={() => {
          setPlayerDialogOpen(false);
          setDocumentOpen(true);
        }}
        onSubmitText={async (message) => {
          await playerLawyer.submitTextReply(message);
          setPlayerDialogOpen(false);
        }}
        request={playerDialogOpen ? playerLawyer.activeRequest : null}
      />
      <CaseTimeline activeCode={scene.stageCode} />
      <DocumentWorkbench
        onClose={() => setDocumentOpen(false)}
        onConfirmed={async () => {
          await playerLawyer.refresh();
        }}
        open={documentOpen}
        request={playerLawyer.activeRequest}
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
            <p>重置会停止当前案件运行，并回到可重新选择案件的状态。已生成的后端状态会按当前重置接口处理。</p>
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
                  await runtime.restart();
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
  return <AuthGate>{(auth) => <AppShell auth={auth} />}</AuthGate>;
}
