import { useState } from 'react';
import { AuthGate, type AuthGateState } from './components/AuthGate';
import { CasePicker } from './components/CasePicker';
import { CaseTimeline } from './components/CaseTimeline';
import { CommandHud } from './components/CommandHud';
import { DialogueBox } from './components/DialogueBox';
import { DocumentWorkbench } from './components/DocumentWorkbench';
import { TechLedger } from './components/TechLedger';
import { VisualNovelStage } from './components/VisualNovelStage';
import { scenes } from './data/demo';
import { useSimulationRuntime } from './state/useSimulationRuntime';

type AppShellProps = {
  auth: AuthGateState;
};

function AppShell({ auth }: AppShellProps) {
  const [documentOpen, setDocumentOpen] = useState(false);
  const [sceneIndex, setSceneIndex] = useState(0);
  const runtime = useSimulationRuntime(auth.backendConfigured && Boolean(auth.user));
  const scene = scenes[sceneIndex];

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
        onPause={runtime.pause}
        onRefresh={runtime.refresh}
        onRestart={runtime.restart}
        scene={scene}
        simulation={runtime.simulation}
        user={auth.user}
      />
      {auth.backendConfigured && auth.user && (
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
        <TechLedger scene={scene} />
        <div className="story-surface">
          <VisualNovelStage scene={scene} />
          <DialogueBox scene={scene} onAction={handleAction} />
        </div>
      </div>
      <CaseTimeline activeCode={scene.stageCode} />
      <DocumentWorkbench open={documentOpen} onClose={() => setDocumentOpen(false)} />
    </main>
  );
}

export function App() {
  return <AuthGate>{(auth) => <AppShell auth={auth} />}</AuthGate>;
}
