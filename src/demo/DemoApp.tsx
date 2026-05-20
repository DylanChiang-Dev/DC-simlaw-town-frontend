import { BuildVersionBadge } from '../components/BuildVersionBadge';
import { CaseClosingSummaryDialog } from '../components/CaseClosingSummaryDialog';
import { CasePicker } from '../components/CasePicker';
import { CaseTimeline } from '../components/CaseTimeline';
import { CommandHud } from '../components/CommandHud';
import { DialogueBox } from '../components/DialogueBox';
import { PlayerLawyerInputDialog } from '../components/PlayerLawyerInputDialog';
import { PlayerLawyerTaskPanel } from '../components/PlayerLawyerTaskPanel';
import { TechLedger } from '../components/TechLedger';
import { TownRadar } from '../components/TownRadar';
import { VisualNovelStage } from '../components/VisualNovelStage';
import type { CaseClosingSummary, SandboxCaseSummary } from '../services/types';
import { useDemoSimulationRuntime } from './useDemoSimulationRuntime';

export function DemoApp() {
  const demo = useDemoSimulationRuntime();
  const caseOptions: SandboxCaseSummary[] = demo.caseOptions.map((item) => ({
    caseId: item.caseId,
    defendantName: item.defendantName,
    difficulty: item.difficulty,
    plaintiffName: item.plaintiffName,
    rawCaseCause: item.trainingCategory,
    status: demo.selectedCase?.caseId === item.caseId ? 'running' : 'idle',
    title: item.title,
    trainingCategory: item.trainingCategory,
  }));
  const activeTask = demo.activeTask;
  const closingSummary = demo.selectedCase ? buildOfflineClosingSummary(demo.selectedCase) : null;
  const casePickerOpen = !demo.selectedCase || !demo.step;
  const activeEntry = demo.activeEntry;
  const canAdvance = Boolean(demo.step && demo.step.type !== 'task' && demo.step.type !== 'closing');
  const advanceLabel = getAdvanceLabel(demo.step, demo.activeStage);

  return (
    <>
      <main className="app-shell demo-app-shell" data-demo-route="offline-full-flow">
        <CommandHud
          autoNextEnabled={false}
          backendConfigured={false}
          canOpenClosingSummary={demo.step?.type === 'closing'}
          loading={false}
          onAutoNextChange={() => undefined}
          onOpenClosingSummary={() => demo.setClosingOpen(true)}
          onRestart={demo.reset}
          runtimeStatus={demo.runtimeStatus}
          simulation={demo.simulation}
          user={demo.user}
          wsConnected={false}
        />
        {casePickerOpen && (
          <CasePicker
            cases={caseOptions}
            disabled={false}
            error=""
            loading={false}
            onOpenHumanEval={() => undefined}
            onRefresh={async () => undefined}
            onSelect={demo.setSelectedCaseId}
            onStart={async (caseId) => demo.startCase(caseId)}
            selectedCaseId={demo.selectedCaseId}
          />
        )}
        {demo.selectedCase && demo.step && (
          <section className="demo-run-strip" aria-label="离线演示控制台">
            <div>
              <span>Offline Full Flow</span>
              <strong>{demo.selectedCase.title}</strong>
              <b>{demo.activeStage?.code || 'CLOSED'} · {demo.activeStage?.title || '结案复盘'}</b>
            </div>
            <p>{demo.selectedCase.summary}</p>
            <div className="demo-run-actions">
              <button className="secondary-action" onClick={demo.exitCase} type="button">
                返回选案
              </button>
              {demo.step.type === 'closing' ? (
                <button className="primary-action" onClick={() => demo.setClosingOpen(true)} type="button">
                  查看结案评分
                </button>
              ) : (
                <button className="primary-action" disabled={!canAdvance} onClick={demo.advance} type="button">
                  {advanceLabel}
                </button>
              )}
            </div>
          </section>
        )}
        <div className="vn-layout">
          <div className="side-rail">
            {demo.activeRequest && (
              <PlayerLawyerTaskPanel
                activeRequest={demo.activeRequest}
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
                caseClosed={demo.step?.type === 'closing'}
                hasPendingUserTask={Boolean(demo.activeRequest)}
                heldDialogueEntryId={activeEntry?.id || ''}
                history={demo.history}
                lastAcknowledgedEntry={activeEntry}
                runtimeStatus={demo.runtimeStatus}
                scene={demo.scene}
                selectedCaseId={demo.selectedCaseId}
                simulation={demo.simulation}
                wsConnected
              />
              <TownRadar radar={demo.radar} scene={demo.scene} />
            </div>
          </div>
        </div>
        <CaseTimeline
          activeCode={demo.scene.stageCode}
          activeEntry={activeEntry}
          backendMode
          history={demo.history}
        />
        {demo.activeRequest && (
          <PlayerLawyerInputDialog
            documentSkill={demo.documentSkill}
            initialDocumentMode={activeTask?.kind === 'document' ? 'drafting' : undefined}
            initialFollowupHistory={activeTask?.followups || []}
            initialMessage={activeTask?.presetText || ''}
            loading={false}
            onClose={() => undefined}
            onFollowupDocument={async (input) => ({
              answer: '演示模式已预置关键追问答案，可以直接进入文书确认。',
              question: input.message,
            })}
            onPolishDocument={async (input) => input.documentText}
            onPolishText={async () => activeTask?.polishedText || activeTask?.presetText || ''}
            onSubmitDocument={async () => demo.submitTask()}
            onSubmitText={async () => demo.submitTask()}
            request={demo.activeRequest}
          />
        )}
        <CaseClosingSummaryDialog
          caseId={demo.selectedCaseId}
          offlineSummary={closingSummary}
          onClose={() => demo.setClosingOpen(false)}
          open={demo.closingOpen}
        />
      </main>
      <BuildVersionBadge />
    </>
  );
}

function buildOfflineClosingSummary(demoCase: NonNullable<ReturnType<typeof useDemoSimulationRuntime>['selectedCase']>): CaseClosingSummary {
  return {
    case: {
      defendantName: demoCase.defendantName,
      difficulty: demoCase.difficulty,
      plaintiffName: demoCase.plaintiffName,
      title: demoCase.title,
      trainingCategory: demoCase.trainingCategory,
    },
    caseId: demoCase.caseId,
    documentCount: demoCase.documents.length,
    documents: demoCase.documents,
    evaluation: demoCase.closing.evaluation,
    playerTurnCount: demoCase.closing.playerTurnCount,
    playerTurns: demoCase.stages
      .filter((stage) => stage.task)
      .map((stage) => ({
        contextSummary: stage.task?.contextSummary || '',
        createdAt: '2026-05-20T10:00:00.000+08:00',
        finalMessage: stage.task?.presetText || '',
        prompt: stage.task?.prompt || '',
        requestId: `demo-${demoCase.caseId}-${stage.code}`,
        resolvedAt: '2026-05-20T10:00:00.000+08:00',
        role: 'plaintiff_lawyer',
        speakerLabel: '李婷',
        stage: stage.code,
        userOriginalMessage: stage.task?.presetText || '',
      })),
  };
}

function getAdvanceLabel(
  step: ReturnType<typeof useDemoSimulationRuntime>['step'],
  activeStage: ReturnType<typeof useDemoSimulationRuntime>['activeStage'],
): string {
  if (step?.type === 'document') return '确认文书并进入下一阶段';
  if (step?.type === 'stage' && activeStage && step.entryIndex < activeStage.entries.length - 1) {
    return '继续下一句';
  }
  if (activeStage?.task) return '处理当前用户任务';
  if (activeStage?.document) return '查看文书结果';
  return '继续下一句';
}
