import { useEffect, useMemo, useState } from 'react';
import { BuildVersionBadge } from '../components/BuildVersionBadge';
import { CaseTimeline } from '../components/CaseTimeline';
import { CommandHud } from '../components/CommandHud';
import { DialogueBox } from '../components/DialogueBox';
import { PlayerLawyerTaskPanel } from '../components/PlayerLawyerTaskPanel';
import { TechLedger } from '../components/TechLedger';
import { TownRadar } from '../components/TownRadar';
import { VisualNovelStage } from '../components/VisualNovelStage';
import { FRONTEND_DEMO_SCENES, DEMO_USER, type FrontendDemoWorkbench } from './frontendDemoFixtures';
import { DemoWorkbench } from './FrontendDemoApp';
import {
  getLiveSimulationStep,
  LIVE_SIMULATION_STEPS,
  LIVE_SIMULATION_TOTAL_MS,
} from './liveSimulationTimeline';

const DEFAULT_START_MS = 0;
const TICK_MS = 250;

export function LiveSimulationDemoApp() {
  const params = new URLSearchParams(window.location.search);
  const startMs = Number(params.get('startMs') || DEFAULT_START_MS);
  const [elapsedMs, setElapsedMs] = useState(startMs);
  const playback = useMemo(() => getLiveSimulationStep(elapsedMs), [elapsedMs]);
  const demo = FRONTEND_DEMO_SCENES[playback.step.sceneId];
  const workbench = getVisibleWorkbench(demo.workbench, playback.step.workbench, playback.progress);
  const taskRequest = workbench.kind === 'reply' || workbench.kind === 'document' || workbench.kind === 'court'
    ? workbench.request
    : null;
  const progressPercent = Math.round(((elapsedMs % LIVE_SIMULATION_TOTAL_MS) / LIVE_SIMULATION_TOTAL_MS) * 100);

  useEffect(() => {
    const startedAt = Date.now() - startMs;
    const timer = window.setInterval(() => {
      setElapsedMs(Date.now() - startedAt);
    }, TICK_MS);
    return () => window.clearInterval(timer);
  }, [startMs]);

  return (
    <>
      <main
        className={`app-shell frontend-recording-demo live-simulation-demo scene-${demo.id}`}
        data-recording-scene="live-simulation"
        data-live-step={demo.id}
      >
        <CommandHud
          autoNextEnabled
          backendConfigured
          canOpenClosingSummary={demo.id === 'closing'}
          loading={false}
          onAutoNextChange={() => undefined}
          onLogout={() => undefined}
          onOpenClosingSummary={() => undefined}
          onOpenDocuments={() => undefined}
          onOpenOnboardingGuide={() => undefined}
          onRestart={() => undefined}
          runtimeStatus={{
            ...demo.runtimeStatus,
            message: playback.step.label,
          }}
          simulation={demo.simulation}
          user={DEMO_USER}
          wsConnected
        />
        <section className="live-simulation-strip" aria-label="实时模拟录屏状态">
          <div>
            <span>Live Simulation</span>
            <strong>{playback.step.label}</strong>
          </div>
          <ol>
            {LIVE_SIMULATION_STEPS.map((step, index) => (
              <li className={index === playback.index ? 'active' : index < playback.index ? 'done' : ''} key={step.sceneId}>
                <b>{index + 1}</b>
                <span>{step.sceneId}</span>
              </li>
            ))}
          </ol>
          <meter max={100} min={0} value={progressPercent} />
        </section>
        <div className="vn-layout">
          <div className="side-rail">
            {(taskRequest || demo.id === 'closing') && (
              <PlayerLawyerTaskPanel
                activeRequest={taskRequest}
                error=""
                loading={false}
                onOpenRequest={() => undefined}
                simulation={demo.simulation}
                status={{ enabled: true, playerMode: 'plaintiff' }}
              />
            )}
            <TechLedger background={demo.history} scene={demo.scene} />
          </div>
          <div className="story-surface">
            <VisualNovelStage scene={demo.scene} />
            <div className="dialogue-dock">
              <DialogueBox
                backendMode
                caseClosed={demo.id === 'closing'}
                hasPendingUserTask={Boolean(taskRequest)}
                heldDialogueEntryId={demo.currentEntry.id}
                history={demo.history}
                lastAcknowledgedEntry={demo.history.length > 1 ? demo.history[demo.history.length - 2] : null}
                runtimeStatus={{
                  ...demo.runtimeStatus,
                  message: playback.step.label,
                }}
                scene={demo.scene}
                selectedCaseId={demo.scene.caseId}
                simulation={demo.simulation}
                wsConnected
              />
              <TownRadar radar={demo.radar} scene={demo.scene} />
            </div>
          </div>
        </div>
        <CaseTimeline
          activeCode={demo.scene.stageCode}
          activeEntry={demo.currentEntry}
          backendMode
          history={demo.history}
          playerPlaintiffPerspective
        />
        <DemoWorkbench workbench={workbench} />
      </main>
      <BuildVersionBadge />
    </>
  );
}

function getVisibleWorkbench(
  workbench: FrontendDemoWorkbench,
  mode: FrontendDemoWorkbench['kind'] | 'auto',
  progress: number,
): FrontendDemoWorkbench {
  if (mode === 'none') return { kind: 'none' };
  if (mode !== 'auto' && workbench.kind !== mode) return { kind: 'none' };
  if (workbench.kind === 'none') return workbench;
  if (progress < 0.18) return { kind: 'none' };
  return workbench;
}
