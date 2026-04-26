import type { PlayerLawyerRequest, PlayerLawyerStatus } from '../services/types';

const STAGE_LABELS: Record<string, string> = {
  LC: '法律咨询',
  CD: '起诉状起草',
  AD: '上诉状起草',
  AR: '上诉答辩起草',
  CI: '一审庭审',
  CIA: '二审庭审',
};

type Props = {
  activeRequest: PlayerLawyerRequest | null;
  error: string;
  loading: boolean;
  onOpenRequest: () => void;
  status: PlayerLawyerStatus | null;
};

export function PlayerLawyerTaskPanel({ activeRequest, error, loading, onOpenRequest, status }: Props) {
  const enabled = Boolean(status?.enabled || activeRequest);
  if (!enabled) return null;

  const stageLabel = activeRequest ? getStageLabel(activeRequest.stage) : '等待案件推进';
  const actionLabel = isDocumentStage(activeRequest?.stage) ? '处理文书任务' : '输入当前角色回复';
  return (
    <aside className="player-lawyer-task-panel" aria-label="当前用户任务">
      <div className="panel-kicker">User Task</div>
      <h2>当前用户任务</h2>
      <p>{stageLabel}</p>
      {activeRequest ? (
        <>
          <strong>{activeRequest.speakerLabel || '轮到用户处理当前角色任务'}</strong>
          <span>{activeRequest.caseId || '当前案件'} / {activeRequest.role || 'plaintiff_lawyer'}</span>
          <button className="primary-action wide" disabled={loading} onClick={onOpenRequest} type="button">
            {loading ? '处理中' : actionLabel}
          </button>
        </>
      ) : (
        <span>{status?.playerMode ? `模式：${status.playerMode}` : '等待系统推进'}</span>
      )}
      {error && <div className="player-lawyer-error" role="alert">{error}</div>}
    </aside>
  );
}

function getStageLabel(stage: string): string {
  return STAGE_LABELS[String(stage || '').toUpperCase()] || stage || '暂无用户操作';
}

function isDocumentStage(stage?: string): boolean {
  return ['CD', 'AD', 'AR'].includes(String(stage || '').toUpperCase());
}
