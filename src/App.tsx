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

function AppShell({ auth }: AppShellProps) {
  const [documentOpen, setDocumentOpen] = useState(false);
  const [documentsOpen, setDocumentsOpen] = useState(false);
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
      ['ws:disconnected', () => dispatchVnEvent({ type: 'ws-disconnected' })],
      ['ws:dialogue-update', (payload) => dispatchVnEvent({ type: 'dialogue-update', payload })],
      ['ws:case-state-change', (payload) => dispatchVnEvent({ type: 'case-state-change', payload })],
      ['ws:scenario-start', (payload) => dispatchVnEvent({ type: 'scenario-start', payload })],
      ['ws:scenario-end', (payload) => dispatchVnEvent({ type: 'scenario-end', payload })],
      ['ws:case-runtime-issue', (payload) => dispatchVnEvent({ type: 'case-runtime-issue', payload })],
      ['ws:player-lawyer-input-required', (payload) => dispatchVnEvent({ type: 'player-lawyer-input-required', payload })],
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
          <TechLedger scene={scene} />
        </div>
        <div className="story-surface">
          <VisualNovelStage scene={scene} />
          <DialogueBox
            backendMode={auth.backendConfigured && Boolean(auth.user)}
            history={vnRuntime.history}
            onAction={handleAction}
            onOpenPlayerInput={() => setPlayerDialogOpen(true)}
            pendingRequest={playerLawyer.activeRequest}
            scene={scene}
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
