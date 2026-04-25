import { FormEvent, useEffect, useState } from 'react';
import { MarkdownText } from './MarkdownText';
import type { PlayerLawyerRequest } from '../services/types';

const DOCUMENT_STAGES = new Set(['CD', 'AD', 'AR']);

type Props = {
  loading: boolean;
  onClose: () => void;
  onOpenDocumentWorkbench: () => void;
  onSubmitText: (message: string) => Promise<void>;
  request: PlayerLawyerRequest | null;
};

export function PlayerLawyerInputDialog({
  loading,
  onClose,
  onOpenDocumentWorkbench,
  onSubmitText,
  request,
}: Props) {
  const [message, setMessage] = useState('');

  useEffect(() => {
    setMessage('');
  }, [request?.requestId]);

  if (!request) return null;

  const stage = String(request.stage || '').toUpperCase();
  const documentStage = DOCUMENT_STAGES.has(stage);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!message.trim()) return;
    await onSubmitText(message.trim());
  }

  return (
    <div className="player-lawyer-dialog-layer" role="dialog" aria-modal="true" aria-label="玩家律师输入">
      <section className="player-lawyer-input-dialog">
        <button className="close-button" type="button" onClick={onClose} aria-label="关闭">×</button>
        <div className="panel-kicker">Player Turn</div>
        <h2>{documentStage ? '文书阶段任务' : '轮到玩家律师发言'}</h2>
        <div className="player-lawyer-request-meta">
          <span>{request.caseId}</span>
          <span>{request.stage}</span>
          <span>{request.speakerLabel || request.role}</span>
        </div>
        <MarkdownText className="player-lawyer-context" text={request.contextSummary} />
        <MarkdownText
          className="player-lawyer-prompt"
          fallback="请根据当前案件进展输入玩家律师回复。"
          text={request.prompt}
        />

        {documentStage ? (
          <div className="player-lawyer-document-callout">
            <p>这个阶段需要进入文书工作台完成模板化输入、Skill 约束草稿和最终确认。</p>
            <button className="primary-action wide" disabled={loading} onClick={onOpenDocumentWorkbench} type="button">
              打开文书工作台
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <textarea
              autoFocus
              disabled={loading}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="输入玩家律师回复..."
              value={message}
            />
            <div className="player-lawyer-dialog-actions">
              <button className="secondary-action" disabled={loading} onClick={onClose} type="button">
                稍后处理
              </button>
              <button className="primary-action" disabled={loading || !message.trim()} type="submit">
                {loading ? '提交中' : '提交回复'}
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}
