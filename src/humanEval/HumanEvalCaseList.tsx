import { useMemo, useState } from 'react';
import type { HumanEvalAssignment, HumanEvalCaseSummary } from '../services/humanEvalApi';

type Props = {
  assignedCases: HumanEvalCaseSummary[];
  allCases: HumanEvalCaseSummary[];
  assignment: HumanEvalAssignment | null;
  selectedCaseId: number | null;
  onSelect: (caseId: number) => void;
};

export function HumanEvalCaseList({ assignedCases, allCases, assignment, selectedCaseId, onSelect }: Props) {
  const [showAllCases, setShowAllCases] = useState(false);
  const visibleCases = showAllCases ? allCases : assignedCases;
  const progressText = useMemo(() => {
    if (!assignment) return '正在生成评测任务';
    return `本批 ${assignment.submitted_count}/${assignment.total_count} 已提交`;
  }, [assignment]);

  return (
    <aside className="human-eval-case-list" aria-label="人工评测案件列表">
      <div className="panel-kicker">Human Evaluation</div>
      <h2>{showAllCases ? '全部评测案件' : '我的评测任务'}</h2>
      <p>{showAllCases ? '完整案件列表仅用于补充查看或手动兜底。' : '系统已为你分配本轮需要完成的 10 个案件。'}</p>
      <div className="human-eval-assignment-summary">
        <span>{showAllCases ? `${allCases.length} 个完整案件` : progressText}</span>
        <button onClick={() => setShowAllCases((value) => !value)} type="button">
          {showAllCases ? '回到我的任务' : '查看全部案件'}
        </button>
      </div>
      {!showAllCases && assignment?.completed && (
        <div className="human-eval-assignment-complete">本批已完成，刷新后将领取下一批案件。</div>
      )}
      <div className="human-eval-case-list-scroll">
        {visibleCases.map((item) => (
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
