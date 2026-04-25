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
    <div className="modal-layer" role="dialog" aria-modal="true" aria-label="选择案件">
      <section className="case-picker" aria-label="案件选择">
        <div className="case-picker-header">
          <div>
            <div className="panel-kicker">Case Docket</div>
            <h2>选择要进入的案件</h2>
          </div>
          <p>选择一个案件后进入法律全流程仿真。案件运行期间，这个选择器不会常驻显示。</p>
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
          {!cases.length && !loading && <div className="empty-case">当前案件工作区没有可启动案件。</div>}
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
            {loading ? '进入中' : '进入所选案件'}
          </button>
        </div>
      </section>
    </div>
  );
}
