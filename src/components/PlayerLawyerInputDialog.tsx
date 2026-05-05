import { FormEvent, useEffect, useState } from 'react';
import { MarkdownText } from './MarkdownText';
import type { PlayerLawyerRequest, PlayerLawyerSkill } from '../services/types';

const DOCUMENT_STAGES = new Set(['CD', 'DD', 'AD', 'AR']);
const MIN_DOCUMENT_FOLLOWUPS_BEFORE_DRAFTING = 2;
const RESPONSE_HINTS = [
  { id: 'liability_scope', label: '责任和赔偿范围', description: '引导用户回应责任承担、合理损失范围和例外。' },
  { id: 'evidence_support', label: '证据支持', description: '引导用户说明医疗、交警、鉴定等证据如何支撑主张。' },
  { id: 'claim_items', label: '赔偿项目', description: '引导用户覆盖医疗费、误工费、护理费等可主张项目。' },
  { id: 'missing_info', label: '追问信息', description: '引导用户向当事人继续追问金额、票据、收入等缺失细节。' },
];
const DOCUMENT_FOLLOWUP_HINTS = [
  {
    id: 'core_fact',
    label: '关键事实',
    question: '请补充本案最关键的事实经过，包括时间、地点、参与人和事件顺序。',
  },
  {
    id: 'amount_basis',
    label: '金额依据',
    question: '请列明目前主张的金额、各项费用的计算依据，以及是否有票据或转账记录。',
  },
  {
    id: 'evidence',
    label: '证据材料',
    question: '请说明你手上已有的证据材料，包括合同、聊天记录、票据、鉴定、报警或就医材料。',
  },
  {
    id: 'opponent_response',
    label: '对方态度',
    question: '请说明对方目前的态度、已经提出的理由或可能抗辩点。',
  },
  {
    id: 'litigation_goal',
    label: '诉讼目标',
    question: '请确认你最希望法院支持的诉求，以及是否接受调解或分期履行。',
  },
  {
    id: 'missing_identity',
    label: '主体信息',
    question: '请补充原被告身份信息、联系方式、住址或统一社会信用代码等起诉状必需信息。',
  },
];

type Props = {
  documentSkill?: PlayerLawyerSkill | null;
  loading: boolean;
  onClose: () => void;
  onFollowupDocument: (input: { message: string }) => Promise<{ question: string; answer: string }>;
  onPolishDocument: (input: { documentText: string; followupHistory: DocumentFollowupPair[] }) => Promise<string>;
  onPolishText: (input: { originalMessage: string; hintIds: string[] }) => Promise<string>;
  onSubmitDocument: (input: { documentText: string }) => Promise<void>;
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

type DocumentFollowupPair = {
  question: string;
  answer: string;
};

type DocumentMode = 'followup' | 'drafting';

export function PlayerLawyerInputDialog({
  documentSkill,
  loading,
  onClose,
  onFollowupDocument,
  onPolishDocument,
  onPolishText,
  onSubmitDocument,
  onSubmitText,
  request,
}: Props) {
  const [message, setMessage] = useState('');
  const [selectedHints, setSelectedHints] = useState<string[]>([]);
  const [polishedMessage, setPolishedMessage] = useState('');
  const [polishError, setPolishError] = useState('');
  const [followupQuestion, setFollowupQuestion] = useState('');
  const [followupHistory, setFollowupHistory] = useState<DocumentFollowupPair[]>([]);
  const [documentMode, setDocumentMode] = useState<DocumentMode>('followup');

  useEffect(() => {
    setMessage('');
    setSelectedHints([]);
    setPolishedMessage('');
    setPolishError('');
    setFollowupQuestion('');
    setDocumentMode('followup');
    setFollowupHistory([]);
  }, [request?.requestId]);

  if (!request) return null;

  const stage = String(request.stage || '').toUpperCase();
  const documentStage = DOCUMENT_STAGES.has(stage);
  const canStartDocumentDraft = followupHistory.length >= MIN_DOCUMENT_FOLLOWUPS_BEFORE_DRAFTING;
  const showDocumentDrafting = documentStage && documentMode === 'drafting';
  const showDocumentFollowup = documentStage && (documentMode === 'followup' || showDocumentDrafting);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!message.trim()) return;
    if (documentStage) {
      if (!showDocumentDrafting || !canStartDocumentDraft) {
        setPolishError(`请先完成至少 ${MIN_DOCUMENT_FOLLOWUPS_BEFORE_DRAFTING} 轮追问，再开始起草文书。`);
        return;
      }
      setPolishError('');
      try {
        await onSubmitDocument({ documentText: message.trim() });
      } catch (err) {
        setPolishError(err instanceof Error ? err.message : '提交文书失败');
      }
      return;
    }
    const finalMessage = (polishedMessage || message).trim();
    setPolishError('');
    try {
      await onSubmitText({
        message: finalMessage,
        originalMessage: message.trim(),
        polishedMessage: polishedMessage.trim(),
        finalMessage,
        hintIds: selectedHints,
        usedAiPolish: Boolean(polishedMessage.trim()),
      });
    } catch (err) {
      setPolishError(err instanceof Error ? err.message : '提交回复失败');
    }
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

  async function handleDocumentPolish(): Promise<void> {
    if (!message.trim()) return;
    setPolishError('');
    try {
      const next = (await onPolishDocument({ documentText: message.trim(), followupHistory })).trim();
      if (next) setMessage(next);
    } catch (err) {
      setPolishError(err instanceof Error ? err.message : '智能体润色失败');
    }
  }

  async function handleDocumentFollowup(): Promise<void> {
    const question = followupQuestion.trim();
    if (!question) return;
    setPolishError('');
    try {
      const next = await onFollowupDocument({ message: question });
      setFollowupHistory((current) => [
        ...current,
        {
          question: next.question || question,
          answer: next.answer || '当事人暂未补充更多信息。',
        },
      ]);
      setFollowupQuestion('');
    } catch (err) {
      setPolishError(err instanceof Error ? err.message : '追问当事人失败');
    }
  }

  function startDocumentDrafting(): void {
    if (!canStartDocumentDraft) {
      setPolishError(`请先完成至少 ${MIN_DOCUMENT_FOLLOWUPS_BEFORE_DRAFTING} 轮追问，再开始起草文书。`);
      return;
    }
    setPolishError('');
    setDocumentMode('drafting');
  }

  function applyDocumentFollowupHint(question: string): void {
    setFollowupQuestion(question);
    setPolishError('');
  }

  function applyTemplate(): void {
    const templateText = String(documentSkill?.templateText || '').trim();
    if (!templateText) return;
    if (message.trim() && !window.confirm('当前输入框已有内容。要用参考模板替换现有内容吗？')) {
      return;
    }
    setMessage(templateText);
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

        <form onSubmit={handleSubmit}>
          <div className="response-assist-explain" aria-label={documentStage ? '文书辅助机制说明' : '回复辅助机制说明'}>
            <strong>{documentStage ? '文书辅助机制' : '回复辅助机制'}</strong>
            {documentStage ? (
              <>
                <p>
                  文书阶段先补事实，再起草。请先完成至少 {MIN_DOCUMENT_FOLLOWUPS_BEFORE_DRAFTING} 轮当事人追问，
                  补齐事实、金额、证据或诉讼立场。
                </p>
                <p>
                  达到追问轮数后再进入起草区，系统会保留模板、智能体润色和手写确认。
                </p>
              </>
            ) : (
              <>
                <p>
                  下方四个按钮只是写作提示，不会直接调用智能助手规则。选择后会记录你的写作方向，
                  帮助你组织原始回复；点击“AI 润色”时，系统才会结合用户原文、提示方向和案件上下文进行润色。
                </p>
                <p>
                  提交时会保存用户原文、最终提交文本、是否使用 AI 润色和提示方向，便于论文实验分析用户输入与辅助机制的关系。
                </p>
              </>
            )}
          </div>
          {!documentStage && (
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
          )}
          {showDocumentDrafting && (
            <section className="document-template-reference" aria-label="参考模板">
              <div className="document-template-header">
                <div>
                  <strong>参考模板</strong>
                  <span>{documentSkill?.templateTitle || '当前阶段文书模板'}</span>
                </div>
                <div className="document-template-actions">
                  <button
                    className="secondary-action"
                    disabled={loading || !documentSkill?.templateText}
                    onClick={applyTemplate}
                    type="button"
                  >
                    套用模板
                  </button>
                  <button
                    className="secondary-action"
                    disabled={loading || !message.trim()}
                    onClick={handleDocumentPolish}
                    type="button"
                  >
                    {loading ? '处理中' : '智能体润色'}
                  </button>
                </div>
              </div>
              {documentSkill?.templateText ? (
                <pre>{documentSkill.templateText}</pre>
              ) : (
                <p>正在读取后端文书模板，稍后可直接参考填写。</p>
              )}
              {Boolean(documentSkill?.qualityCheck.length) && (
                <ul>
                  {documentSkill?.qualityCheck.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
            </section>
          )}
          {!documentStage && (
            <textarea
              autoFocus
              disabled={loading}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="请写下你准备让当前角色表达的回复要点。"
              value={message}
            />
          )}
          {showDocumentDrafting && (
            <textarea
              autoFocus
              disabled={loading}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="请写入完整文书正文，或先套用参考模板后修改。"
              value={message}
            />
          )}
          {showDocumentFollowup && (
            <section className="document-followup-panel" aria-label="追问当事人">
              <div className="document-followup-header">
                <strong>追问当事人</strong>
                <span>
                  已完成 {followupHistory.length}/{MIN_DOCUMENT_FOLLOWUPS_BEFORE_DRAFTING} 轮必需追问；
                  满 2 轮后可以开始起草，也可以继续追问。
                </span>
              </div>
              <div className="document-followup-hints" aria-label="追问提示">
                {DOCUMENT_FOLLOWUP_HINTS.map((hint) => (
                  <button
                    className="document-followup-hint"
                    disabled={loading}
                    key={hint.id}
                    onClick={() => applyDocumentFollowupHint(hint.question)}
                    title={hint.question}
                    type="button"
                  >
                    {hint.label}
                  </button>
                ))}
              </div>
              <div className="document-followup-row">
                <textarea
                  disabled={loading}
                  onChange={(event) => setFollowupQuestion(event.target.value)}
                  placeholder="写下要向当事人追问的一个具体问题。"
                  value={followupQuestion}
                />
                {showDocumentDrafting && (
                  <button
                    className="secondary-action"
                    disabled={loading || !followupQuestion.trim()}
                    onClick={handleDocumentFollowup}
                    type="button"
                  >
                    {loading ? '追问中' : '追问当事人'}
                  </button>
                )}
              </div>
              {documentMode === 'followup' && canStartDocumentDraft && (
                <div className="document-followup-actions">
                  <button className="primary-action" disabled={loading} onClick={startDocumentDrafting} type="button">
                    开始起草
                  </button>
                </div>
              )}
              <div className="document-followup-history" aria-label="追问记录">
                {followupHistory.length > 0 ? (
                  followupHistory.map((item, index) => (
                    <article key={`${index}-${item.question}`}>
                      <strong>第 {index + 1} 问：{item.question}</strong>
                      <span>答：{item.answer}</span>
                    </article>
                  ))
                ) : (
                  <p className="document-followup-empty">
                    尚未追问。先选择一个提示方向，或直接写下你要补充核实的问题。
                  </p>
                )}
              </div>
            </section>
          )}
          {!documentStage && (
            <div className="response-assist-actions">
              <button className="secondary-action" disabled={loading || !message.trim()} onClick={handlePolish} type="button">
                {loading ? '处理中' : 'AI 润色'}
              </button>
            </div>
          )}
          {!documentStage && polishedMessage && (
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
            {documentStage && documentMode === 'followup' ? (
              <button className="primary-action" disabled={loading || !followupQuestion.trim()} onClick={handleDocumentFollowup} type="button">
                {loading ? '追问中' : '提交追问'}
              </button>
            ) : (
              <button
                className="primary-action"
                disabled={loading || !message.trim() || (documentStage && !canStartDocumentDraft)}
                type="submit"
              >
                {loading ? '提交中' : documentStage ? '提交文书并继续' : '提交回复'}
              </button>
            )}
          </div>
        </form>
      </section>
    </div>
  );
}
