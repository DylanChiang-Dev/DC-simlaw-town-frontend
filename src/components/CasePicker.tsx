import type { SandboxCaseSummary } from '../services/types';

type Props = {
  cases: SandboxCaseSummary[];
  disabled?: boolean;
  error: string;
  loading: boolean;
  onRefresh: () => Promise<void>;
  onSelect: (caseId: string) => void;
  onStart: (caseId?: string) => Promise<void>;
  selectedCaseId: string;
};

export function CasePicker({
  cases,
  disabled = false,
  error,
  loading,
  onRefresh,
  onSelect,
  onStart,
  selectedCaseId,
}: Props) {
  return (
    <section className="case-picker" aria-label="案件选择">
      <div>
        <div className="panel-kicker">Case Docket</div>
        <h2>选择要进入的案件</h2>
        <p>真实后端模式会从当前账号的沙盒读取案件。启动后，VN 场景会逐步接入后端事件、玩家律师任务和文书结果。</p>
      </div>
      {error && <div className="case-picker-error" role="alert">{error}</div>}
      <div className="case-list">
        {cases.map((item) => {
          const active = item.caseId === selectedCaseId;
          return (
            <button
              className={`case-card ${active ? 'active' : ''}`}
              disabled={disabled || loading}
              key={item.caseId}
              onClick={() => onSelect(item.caseId)}
              type="button"
            >
              <strong>{item.title}</strong>
              <span>{item.plaintiffName} 诉 {item.defendantName}</span>
              <small>{item.trainingCategory || item.rawCaseCause} / {item.difficulty}</small>
            </button>
          );
        })}
        {!cases.length && !loading && <div className="empty-case">当前沙盒没有可启动案件。</div>}
      </div>
      <div className="case-picker-actions">
        <button className="secondary-action" disabled={disabled || loading} onClick={() => void onRefresh()} type="button">
          刷新案件
        </button>
        <button
          className="primary-action"
          disabled={disabled || loading || !selectedCaseId}
          onClick={() => void onStart(selectedCaseId)}
          type="button"
        >
          {loading ? '处理中' : '启动所选案件'}
        </button>
      </div>
    </section>
  );
}
