import type { OnboardingStep } from '../onboarding/onboardingContent';

type Props = {
  onConfirm: () => void;
  onDismiss: () => void;
  onOpenGuide: () => void;
  step: OnboardingStep | null;
};

export function OnboardingCoach({ onConfirm, onDismiss, onOpenGuide, step }: Props) {
  if (!step) return null;

  if (step.kind === 'light') {
    return (
      <aside className="onboarding-coach light" aria-label="新手提示">
        <div className="onboarding-coach-copy">
          <strong>{step.title}</strong>
          <span>{step.description}</span>
        </div>
        <div className="onboarding-coach-inline-actions">
          <button className="onboarding-coach-secondary" onClick={onOpenGuide} type="button">
            查看流程
          </button>
          <button className="onboarding-coach-ack" onClick={onDismiss} type="button">
            知道了
          </button>
        </div>
      </aside>
    );
  }

  if (step.kind === 'key') {
    return (
      <div className="onboarding-coach key" role="dialog" aria-modal="true" aria-label="关键任务提示">
        <section>
          <div className="panel-kicker">{step.phaseLabel}</div>
          <h2>{step.title}</h2>
          <p>{step.description}</p>
          <div className="onboarding-coach-card">
            <strong>短示例</strong>
            <span>{step.example}</span>
          </div>
          <div className="onboarding-coach-card">
            <strong>评分重点</strong>
            <span>{step.scoringFocus}</span>
          </div>
          <div className="onboarding-coach-actions">
            <button className="secondary-action" onClick={onOpenGuide} type="button">
              查看完整流程
            </button>
            <button className="primary-action" title="知道了，开始处理" onClick={onConfirm} type="button">
              知道了，开始处理
            </button>
          </div>
        </section>
      </div>
    );
  }

  return null;
}
