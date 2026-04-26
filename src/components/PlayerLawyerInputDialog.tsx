import { FormEvent, useEffect, useState } from 'react';
import { MarkdownText } from './MarkdownText';
import type { PlayerLawyerRequest } from '../services/types';

const DOCUMENT_STAGES = new Set(['CD', 'AD', 'AR']);
const RESPONSE_HINTS = [
  { id: 'liability_scope', label: '责任和赔偿范围', description: '引导用户回应责任承担、合理损失范围和例外。' },
  { id: 'evidence_support', label: '证据支持', description: '引导用户说明医疗、交警、鉴定等证据如何支撑主张。' },
  { id: 'claim_items', label: '赔偿项目', description: '引导用户覆盖医疗费、误工费、护理费等可主张项目。' },
  { id: 'missing_info', label: '追问信息', description: '引导用户向当事人继续追问金额、票据、收入等缺失细节。' },
];

type Props = {
  loading: boolean;
  onClose: () => void;
  onAutoDocumentSubmit: () => Promise<void>;
  onOpenDocumentWorkbench: () => void;
  onDraftText: (input: { hintIds: string[] }) => Promise<string>;
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
  onAutoDocumentSubmit,
  onOpenDocumentWorkbench,
  onDraftText,
  onPolishText,
  onSubmitText,
  request,
}: Props) {
  const [message, setMessage] = useState('');
  const [autoDocumentLoading, setAutoDocumentLoading] = useState(false);
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

  async function handleAutoDraftSubmit(): Promise<void> {
    if (loading) return;
    setPolishError('');
    try {
      const draft = (await onDraftText({ hintIds: selectedHints })).trim();
      if (!draft) return;
      setMessage(draft);
      setPolishedMessage(draft);
      await onSubmitText({
        message: draft,
        originalMessage: '',
        polishedMessage: draft,
        finalMessage: draft,
        hintIds: selectedHints,
        usedAiPolish: true,
      });
    } catch (err) {
      setPolishError(err instanceof Error ? err.message : 'AI 代答失败');
    }
  }

  async function handleAutoDocumentSubmit(): Promise<void> {
    if (loading || autoDocumentLoading) return;
    setPolishError('');
    setAutoDocumentLoading(true);
    try {
      await onAutoDocumentSubmit();
    } catch (err) {
      setPolishError(err instanceof Error ? err.message : 'AI 生成文书失败');
    } finally {
      setAutoDocumentLoading(false);
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
            <div className="document-callout-actions">
              <button
                className="primary-action wide"
                disabled={loading || autoDocumentLoading}
                onClick={handleAutoDocumentSubmit}
                type="button"
              >
                {autoDocumentLoading ? '生成并确认中' : 'AI 生成文书并继续流程'}
              </button>
              <button
                className="secondary-action wide"
                disabled={loading || autoDocumentLoading}
                onClick={onOpenDocumentWorkbench}
                type="button"
              >
                打开文书工作台
              </button>
            </div>
            {polishError && <div className="document-error" role="alert">{polishError}</div>}
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="response-assist-explain" aria-label="回复辅助机制说明">
              <strong>回复辅助机制</strong>
              <p>
                下方四个按钮是前端写作提示，不是 Agent Skill 调用。选择后只记录提示方向
                <code>hint_ids</code>，帮助用户组织原始回复；点击“AI 润色”时，系统才把用户原文、提示方向和案件上下文发送给后端润色接口。
              </p>
              <p>
                提交时会保存用户原文、最终提交文本、是否使用 AI 润色和提示方向，便于论文实验分析用户输入与辅助机制的关系。
              </p>
            </div>
            <div className="response-hint-row" aria-label="回复提示">
              {RESPONSE_HINTS.map((hint) => (
                <button
                  className={`response-hint-chip ${selectedHints.includes(hint.id) ? 'selected' : ''}`}
                  disabled={loading}
                  key={hint.id}
                  onClick={() => toggleHint(hint.id)}
                  title={hint.description}
                  type="button"
                >
                  {hint.label}
                  <span>{hint.description}</span>
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
              <button className="secondary-action" disabled={loading} onClick={handleAutoDraftSubmit} type="button">
                {loading ? '处理中' : 'AI 代答并提交'}
              </button>
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
