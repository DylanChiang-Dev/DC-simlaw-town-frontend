import { FormEvent, useEffect, useState } from 'react';
import { MarkdownText } from './MarkdownText';
import type { PlayerLawyerRequest } from '../services/types';

const DOCUMENT_STAGES = new Set(['CD', 'AD', 'AR']);
const RESPONSE_HINTS = [
  { id: 'liability_scope', label: '责任和赔偿范围' },
  { id: 'evidence_support', label: '证据支持' },
  { id: 'claim_items', label: '赔偿项目' },
  { id: 'missing_info', label: '追问信息' },
];

type Props = {
  loading: boolean;
  onClose: () => void;
  onOpenDocumentWorkbench: () => void;
  onPolishText: (input: { originalMessage: string; hintIds: string[] }) => Promise<string>;
  onSubmitText: (input: {
    message: string;
    originalMessage: string;
    polishedMessage: string;
    finalMessage: string;
    hintIds: string[];
    usedAiPolish: boolean;
  }) => Promise<void>;
  request: PlayerLawyerRequest | null;
};

export function PlayerLawyerInputDialog({
  loading,
  onClose,
  onOpenDocumentWorkbench,
  onPolishText,
  onSubmitText,
  request,
}: Props) {
  const [message, setMessage] = useState('');
  const [selectedHints, setSelectedHints] = useState<string[]>([]);
  const [polishedMessage, setPolishedMessage] = useState('');
  const [polishError, setPolishError] = useState('');

  useEffect(() => {
    setMessage('');
    setSelectedHints([]);
    setPolishedMessage('');
    setPolishError('');
  }, [request?.requestId]);

  if (!request) return null;

  const stage = String(request.stage || '').toUpperCase();
  const documentStage = DOCUMENT_STAGES.has(stage);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!message.trim()) return;
    const finalMessage = (polishedMessage || message).trim();
    await onSubmitText({
      message: finalMessage,
      originalMessage: message.trim(),
      polishedMessage: polishedMessage.trim(),
      finalMessage,
      hintIds: selectedHints,
      usedAiPolish: Boolean(polishedMessage.trim()),
    });
  }

  function toggleHint(hintId: string): void {
    setSelectedHints((current) => (
      current.includes(hintId)
        ? current.filter((item) => item !== hintId)
        : [...current, hintId]
    ));
  }

  async function handlePolish(): Promise<void> {
    if (!message.trim()) return;
    setPolishError('');
    try {
      const next = await onPolishText({
        originalMessage: message.trim(),
        hintIds: selectedHints,
      });
      setPolishedMessage(next);
    } catch (err) {
      setPolishError(err instanceof Error ? err.message : 'AI 润色失败');
    }
  }

  return (
    <div className="player-lawyer-dialog-layer" role="dialog" aria-modal="true" aria-label="当前角色输入">
      <section className="player-lawyer-input-dialog">
        <button className="close-button" type="button" onClick={onClose} aria-label="关闭">×</button>
        <div className="panel-kicker">User Turn</div>
        <h2>{documentStage ? '文书阶段任务' : '轮到用户处理当前角色发言'}</h2>
        <div className="player-lawyer-request-meta">
          <span>{request.caseId}</span>
          <span>{request.stage}</span>
          <span>{request.speakerLabel || request.role}</span>
        </div>
        <MarkdownText className="player-lawyer-context" text={request.contextSummary} />
        <MarkdownText
          className="player-lawyer-prompt"
          fallback="请根据当前案件进展输入当前角色回复。"
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
            <div className="response-hint-row" aria-label="回复提示">
              {RESPONSE_HINTS.map((hint) => (
                <button
                  className={`response-hint-chip ${selectedHints.includes(hint.id) ? 'selected' : ''}`}
                  disabled={loading}
                  key={hint.id}
                  onClick={() => toggleHint(hint.id)}
                  type="button"
                >
                  {hint.label}
                </button>
              ))}
            </div>
            <textarea
              autoFocus
              disabled={loading}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="请写下你准备让当前角色表达的回复要点。"
              value={message}
            />
            <div className="response-assist-actions">
              <button className="secondary-action" disabled={loading || !message.trim()} onClick={handlePolish} type="button">
                {loading ? '处理中' : 'AI 润色'}
              </button>
            </div>
            {polishedMessage && (
              <label className="polished-response-field">
                <span>润色稿，可继续修改</span>
                <textarea
                  disabled={loading}
                  onChange={(event) => setPolishedMessage(event.target.value)}
                  value={polishedMessage}
                />
              </label>
            )}
            {polishError && <div className="document-error" role="alert">{polishError}</div>}
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
