import { useMemo, useState } from 'react';
import {
  getOnboardingStepById,
  getOnboardingStepIndex,
  ONBOARDING_STEPS,
  type OnboardingStepVisualType,
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
      <OnboardingVisualPreview type={activeStep.visualType} />
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

function OnboardingVisualPreview({ type }: { type: OnboardingStepVisualType }) {
  const titleByType: Record<OnboardingStepVisualType, string> = {
    'case-picker': '案件选择界面',
    dialogue: '角色对白界面',
    'reply-input': '玩家回复工作台',
    'document-followup': '文书追问工作台',
    'document-drafting': '文书起草工作台',
    'court-argument': '庭审输入界面',
    'closing-score': '结案评分面板',
    'markdown-review': '复盘 Markdown 导出',
  };

  return (
    <figure className={`onboarding-visual-preview ${type}`} aria-label={`${titleByType[type]}示意图`}>
      <figcaption>
        <strong>界面示意</strong>
        <span>{titleByType[type]}</span>
      </figcaption>
      <div className="onboarding-visual-frame" aria-hidden="true">
        {renderVisualPreview(type)}
      </div>
    </figure>
  );
}

function renderVisualPreview(type: OnboardingStepVisualType) {
  if (type === 'case-picker') {
    return (
      <div className="visual-case-grid">
        <span />
        <span className="selected" />
        <span />
      </div>
    );
  }

  if (type === 'dialogue') {
    return (
      <div className="visual-dialogue-scene">
        <span className="avatar left" />
        <span className="avatar right" />
        <div className="dialogue-card">
          <b />
          <i />
          <i className="short" />
        </div>
      </div>
    );
  }

  if (type === 'reply-input' || type === 'court-argument') {
    return (
      <div className="visual-input-workbench">
        <div className="context-panel">
          <span />
          <span />
          <span className="short" />
        </div>
        <div className="input-panel">
          <b />
          <i />
          <i />
          <em>{type === 'court-argument' ? '庭审发言' : '提交回复'}</em>
        </div>
      </div>
    );
  }

  if (type === 'document-followup') {
    return (
      <div className="visual-document-workbench">
        <div className="document-sidebar">
          <span />
          <span />
          <span />
        </div>
        <div className="document-main followup">
          <b />
          <i />
          <i className="short" />
          <em>提交追问</em>
        </div>
      </div>
    );
  }

  if (type === 'document-drafting') {
    return (
      <div className="visual-document-workbench">
        <div className="document-sidebar">
          <span />
          <span />
          <span />
        </div>
        <div className="document-main drafting">
          <b />
          <i />
          <i />
          <i className="short" />
          <em>确认文书</em>
        </div>
      </div>
    );
  }

  if (type === 'closing-score') {
    return (
      <div className="visual-score-panel">
        <span className="score-badge">86</span>
        <div>
          <i />
          <i />
          <i className="short" />
        </div>
      </div>
    );
  }

  return (
    <div className="visual-markdown-panel">
      <span>#</span>
      <div>
        <i />
        <i />
        <i className="short" />
      </div>
      <em>导出 Markdown</em>
    </div>
  );
}
