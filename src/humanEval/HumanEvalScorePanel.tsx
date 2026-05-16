import type { HumanEvalMetricScore, HumanEvalRatingPayload, HumanEvalStageScore } from '../services/humanEvalApi';

type Props = {
  activeStage: string;
  rating: HumanEvalRatingPayload;
  raterId: string;
  onRaterIdChange: (value: string) => void;
  onRatingChange: (rating: HumanEvalRatingPayload) => void;
  onSave: (status: 'draft' | 'submitted') => void;
  saving: boolean;
};

const SCORABLE_STAGES = ['LC', 'DRAFT', 'CI', 'APPEAL_DRAFT', 'CIA'];
const ROLE_METRICS = [
  ['client_stance_authenticity', '当事人立场与动机真实性'],
  ['client_role_distinguishability', '当事人角色区分度'],
  ['lawyer_stance_authenticity', '律师立场与动机真实性'],
  ['lawyer_role_distinguishability', '律师角色区分度'],
  ['judge_stance_authenticity', '法官立场与动机真实性'],
  ['judge_role_distinguishability', '法官角色区分度'],
] as const;

const SCORE_OPTIONS = [
  [0, '0 未打分'],
  [1, '1'],
  [2, '2'],
  [3, '3'],
  [4, '4'],
  [5, '5'],
  [6, '6'],
  [7, '7'],
  [8, '8'],
  [9, '9'],
  [10, '10'],
] as const;

const MAX_VISIBLE_SUBMIT_BLOCKERS = 6;

function emptyMetric(): HumanEvalMetricScore {
  return { score: 0, reason: '' };
}

function validateMetric(metric: HumanEvalMetricScore): boolean {
  const score = metric.score;
  return Number.isInteger(score) && score > 0 && score <= 10 && Boolean(metric.reason.trim());
}

function getMetricIssues(metric: HumanEvalMetricScore): string[] {
  const issues: string[] = [];
  const score = metric.score;
  if (!Number.isInteger(score) || score <= 0 || score > 10) {
    issues.push('未打分');
  }
  if (!metric.reason.trim()) {
    issues.push('缺少理由');
  }
  return issues;
}

function buildSubmitBlockers(rating: HumanEvalRatingPayload, raterId: string): string[] {
  const blockers: string[] = [];
  if (!raterId.trim()) {
    blockers.push('评审编号：未填写');
  }

  SCORABLE_STAGES.forEach((stage) => {
    const score = rating.stage_scores[stage];
    ([
      ['procedural_compliance', '程序合规性'],
      ['process_coherence', '流程衔接合理性'],
    ] as const).forEach(([metric, label]) => {
      const issues = getMetricIssues(score?.[metric] || emptyMetric());
      if (issues.length > 0) {
        blockers.push(`${stage}-${label}：${issues.join(' / ')}`);
      }
    });
  });

  ROLE_METRICS.forEach(([metric, label]) => {
    const issues = getMetricIssues(rating.role_scores[metric] || emptyMetric());
    if (issues.length > 0) {
      blockers.push(`${label}：${issues.join(' / ')}`);
    }
  });

  return blockers;
}

function updateStageMetric(
  rating: HumanEvalRatingPayload,
  stage: string,
  metric: keyof HumanEvalStageScore,
  value: HumanEvalMetricScore,
): HumanEvalRatingPayload {
  return {
    ...rating,
    stage_scores: {
      ...rating.stage_scores,
      [stage]: {
        procedural_compliance: rating.stage_scores[stage]?.procedural_compliance || emptyMetric(),
        process_coherence: rating.stage_scores[stage]?.process_coherence || emptyMetric(),
        [metric]: value,
      },
    },
  };
}

export function HumanEvalScorePanel({
  activeStage,
  rating,
  raterId,
  onRaterIdChange,
  onRatingChange,
  onSave,
  saving,
}: Props) {
  const stageIsScorable = SCORABLE_STAGES.includes(activeStage);
  const stageScore = rating.stage_scores[activeStage];
  const allStageMetricsValid = SCORABLE_STAGES.every((stage) => {
    const score = rating.stage_scores[stage];
    return score && validateMetric(score.procedural_compliance) && validateMetric(score.process_coherence);
  });
  const allRoleMetricsValid = ROLE_METRICS.every(([metric]) => validateMetric(rating.role_scores[metric] || emptyMetric()));
  const submitBlockers = buildSubmitBlockers(rating, raterId);
  const visibleSubmitBlockers = submitBlockers.slice(0, MAX_VISIBLE_SUBMIT_BLOCKERS);
  const hiddenSubmitBlockerCount = submitBlockers.length - visibleSubmitBlockers.length;
  const canSubmit = Boolean(raterId.trim()) && allStageMetricsValid && allRoleMetricsValid && submitBlockers.length === 0;

  return (
    <aside className="human-eval-score-panel" aria-label="人工评测评分表">
      <label className="human-eval-rater-field">
        评审编号
        <input value={raterId} onChange={(event) => onRaterIdChange(event.target.value)} placeholder="rater_01" />
      </label>

      {stageIsScorable ? (
        <section>
          <div className="panel-kicker">当前阶段评分</div>
          <h3>{activeStage}</h3>
          {(['procedural_compliance', 'process_coherence'] as const).map((metric) => {
            const value = stageScore?.[metric] || emptyMetric();
            return (
              <div className="human-eval-score-card" key={metric}>
                <strong>{metric === 'procedural_compliance' ? '程序合规性' : '流程衔接合理性'}</strong>
                <select
                  value={value.score}
                  onChange={(event) => onRatingChange(updateStageMetric(rating, activeStage, metric, { ...value, score: Number(event.target.value) }))}
                >
                  {SCORE_OPTIONS.map(([score, label]) => (
                    <option key={score} value={score}>{label}</option>
                  ))}
                </select>
                <textarea
                  value={value.reason}
                  onChange={(event) => onRatingChange(updateStageMetric(rating, activeStage, metric, { ...value, reason: event.target.value }))}
                  placeholder="填写简短理由"
                />
              </div>
            );
          })}
        </section>
      ) : (
        <section className="human-eval-display-only-stage">SD 只展示上诉决策过渡信息，不需要评分。</section>
      )}

      <section>
        <div className="panel-kicker">全案角色一致性</div>
        {ROLE_METRICS.map(([metric, label]) => {
          const value = rating.role_scores[metric] || emptyMetric();
          return (
            <div className="human-eval-score-card compact" key={metric}>
              <strong>{label}</strong>
              <select
                value={value.score}
                onChange={(event) => onRatingChange({
                  ...rating,
                  role_scores: {
                    ...rating.role_scores,
                    [metric]: { ...value, score: Number(event.target.value) },
                  },
                })}
              >
                {SCORE_OPTIONS.map(([score, label]) => (
                  <option key={score} value={score}>{label}</option>
                ))}
              </select>
              <textarea
                value={value.reason}
                onChange={(event) => onRatingChange({
                  ...rating,
                  role_scores: {
                    ...rating.role_scores,
                    [metric]: { ...value, reason: event.target.value },
                  },
                })}
                placeholder="填写简短理由"
              />
            </div>
          );
        })}
      </section>

      {submitBlockers.length > 0 && (
        <div className="human-eval-submit-hint" aria-live="polite">
          <strong>还有评分项未完成，填写全部分数和理由后才能提交问卷。</strong>
          <ul>
            {visibleSubmitBlockers.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          {hiddenSubmitBlockerCount > 0 && (
            <p>还有 {hiddenSubmitBlockerCount} 项未显示，请继续补全各阶段评分和角色评分。</p>
          )}
        </div>
      )}

      <div className="human-eval-score-actions">
        <button disabled={saving || !raterId.trim()} onClick={() => onSave('draft')} type="button">保存草稿</button>
        <button disabled={saving || !canSubmit} onClick={() => onSave('submitted')} type="button">提交问卷</button>
      </div>
    </aside>
  );
}
