import { useState } from 'react';
import { CommandHud } from './components/CommandHud';
import { DocumentWorkbench } from './components/DocumentWorkbench';
import { HeroStage } from './components/HeroStage';
import { LifecycleTimeline } from './components/LifecycleTimeline';
import { PlayerTaskPanel } from './components/PlayerTaskPanel';
import { TechShowcasePanel } from './components/TechShowcasePanel';

export function App() {
  const [documentOpen, setDocumentOpen] = useState(false);

  return (
    <main className="app-shell">
      <CommandHud />
      <div className="demo-layout">
        <PlayerTaskPanel onOpenDocument={() => setDocumentOpen(true)} />
        <HeroStage />
        <TechShowcasePanel />
      </div>
      <LifecycleTimeline />
      <DocumentWorkbench open={documentOpen} onClose={() => setDocumentOpen(false)} />
    </main>
  );
}
