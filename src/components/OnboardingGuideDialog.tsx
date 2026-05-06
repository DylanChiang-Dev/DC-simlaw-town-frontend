import { useMemo, useState } from 'react';
import {
  getOnboardingStepById,
  getOnboardingStepIndex,
  ONBOARDING_STEPS,
  type OnboardingStepId,
} from '../onboarding/onboardingContent';
import { TaskWorkbenchShell } from './TaskWorkbenchShell';

type Props = {
  currentStepId: OnboardingStepId | null;
  onClose: () => void;
  onReset: () => void;
  open: boolean;
};

export function OnboardingGuideDialog({ currentStepId, onClose, onReset, open }: Props) {
  const [selectedStepId, setSelectedStepId] = useState<OnboardingStepId | null>(null);
  const activeStepId = selectedStepId || currentStepId || ONBOARDING_STEPS[0]?.id || null;
  const activeStep = useMemo(() => getOnboardingStepById(activeStepId), [activeStepId]);
  const currentStepIndex = getOnboardingStepIndex(currentStepId);

  if (!open || !activeStep) return null;

  const left = (
    <div className="onboarding-guide-map" aria-label="新手导航流程地图">
      {ONBOARDING_STEPS.map((step, index) => {
        const active = step.id === activeStep.id;
        const current = step.id === currentStepId;
        const complete = currentStepIndex >= 0 && index < currentStepIndex;
        return (
          <button
            className={`onboarding-guide-step ${active ? 'active' : ''} ${current ? 'current' : ''}`}
            key={step.id}
            onClick={() => setSelectedStepId(step.id)}
            type="button"
          >
            <span>{index + 1}</span>
            <strong>{step.title}</strong>
            <small>{complete ? '已走过' : current ? '当前阶段' : step.phaseLabel}</small>
          </button>
        );
      })}
    </div>
  );

  const right = (
    <section className="onboarding-guide-detail">
      <div className="panel-kicker">{activeStep.phaseLabel}</div>
      <h3>{activeStep.title}</h3>
      <p>{activeStep.description}</p>
      <div className="onboarding-guide-card">
        <strong>需要输入或关注的内容</strong>
        <span>{activeStep.example}</span>
      </div>
      <div className="onboarding-guide-card">
        <strong>评分重点</strong>
        <span>{activeStep.scoringFocus}</span>
      </div>
    </section>
  );

  const footer = (
    <>
      <button aria-label="重置新手导航" className="secondary-action" onClick={onReset} type="button">
        重置新手导航
      </button>
      <button className="primary-action" onClick={onClose} type="button">
        关闭
      </button>
    </>
  );

  return (
    <TaskWorkbenchShell
      ariaLabel="新手导航"
      closeLabel="关闭新手导航"
      kicker="Onboarding"
      left={left}
      right={right}
      footer={footer}
      meta={<span>流程地图 + 分段教练</span>}
      onClose={onClose}
      title="新手导航"
    />
  );
}
