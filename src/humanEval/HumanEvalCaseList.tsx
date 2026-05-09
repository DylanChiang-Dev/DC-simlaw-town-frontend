import type { HumanEvalCaseSummary } from '../services/humanEvalApi';

type Props = {
  cases: HumanEvalCaseSummary[];
  selectedCaseId: number | null;
  onSelect: (caseId: number) => void;
};

export function HumanEvalCaseList({ cases, selectedCaseId, onSelect }: Props) {
  return (
    <aside className="human-eval-case-list" aria-label="人工评测案件列表">
      <div className="panel-kicker">Human Evaluation</div>
      <h2>人工评测</h2>
      <p>选择一个案件，阅读完整流程并填写评分。</p>
      <div className="human-eval-case-count">{cases.length} 个完整案件</div>
      <div className="human-eval-case-list-scroll">
        {cases.map((item) => (
          <button
            className={`human-eval-case-item ${item.case_id === selectedCaseId ? 'active' : ''}`}
            key={item.case_id}
            onClick={() => onSelect(item.case_id)}
            type="button"
          >
            <strong>{item.case_key}</strong>
            <span>{item.case_cause}</span>
            <small>{item.message_count} 条消息 · {item.rating_status === 'submitted' ? '已提交' : item.rating_status === 'draft' ? '草稿' : '未开始'}</small>
          </button>
        ))}
      </div>
    </aside>
  );
}
