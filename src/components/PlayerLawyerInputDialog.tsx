import { FormEvent, useEffect, useRef, useState } from "react";
import { MarkdownText } from "./MarkdownText";
import { TaskWorkbenchShell } from "./TaskWorkbenchShell";
import type { PlayerLawyerRequest, PlayerLawyerSkill } from "../services/types";

const MIN_DOCUMENT_FOLLOWUPS_BEFORE_DRAFTING = 2;
const RESPONSE_HINTS = [
  {
    id: "liability_scope",
    label: "责任和赔偿范围",
    description: "引导用户回应责任承担、合理损失范围和例外。",
  },
  {
    id: "evidence_support",
    label: "证据支持",
    description: "引导用户说明医疗、交警、鉴定等证据如何支撑主张。",
  },
  {
    id: "claim_items",
    label: "赔偿项目",
    description: "引导用户覆盖医疗费、误工费、护理费等可主张项目。",
  },
  {
    id: "missing_info",
    label: "追问信息",
    description: "引导用户向当事人继续追问金额、票据、收入等缺失细节。",
  },
];
const DOCUMENT_FOLLOWUP_HINTS_BY_STAGE = {
  CD: [
    {
      id: "core_fact",
      label: "关键事实",
      example: "事情发生的时间、地点、经过和在场人员，能再说清楚吗？",
    },
    {
      id: "amount_basis",
      label: "请求依据",
      example: "你提出的每项请求分别依据哪些事实、约定或法律关系？",
    },
    {
      id: "evidence",
      label: "证据材料",
      example: "你手上有哪些能证明这些事实和请求的材料？现在是否能提交？",
    },
    {
      id: "opponent_response",
      label: "对方态度",
      example: "对方现在承认、拒绝，还是提出过其他说法？",
    },
    {
      id: "litigation_goal",
      label: "诉讼目标",
      example: "你最希望法院支持哪几项请求？有没有可以接受的底线？",
    },
    {
      id: "missing_identity",
      label: "主体信息",
      example: "对方姓名、身份、地址、联系方式是否完整准确？",
    },
  ],
  DD: [
    {
      id: "claim_scope",
      label: "对方诉请",
      example: "对方主张的每一项请求，你认可哪些、反对哪些？",
    },
    {
      id: "defense_fact",
      label: "答辩事实",
      example: "有哪些事实可以说明对方说法不完整、不准确或不能成立？",
    },
    {
      id: "evidence_response",
      label: "证据反驳",
      example: "对方提交的证据里，哪些真实性、关联性或证明目的需要反驳？",
    },
    {
      id: "legal_defense",
      label: "法律抗辩",
      example: "本案有没有时效、主体、责任范围或合同履行方面的抗辩理由？",
    },
    {
      id: "settlement_bottom_line",
      label: "处理底线",
      example: "如果法院调解，你能接受的范围和不能接受的底线是什么？",
    },
  ],
  AD: [
    {
      id: "first_instance_error",
      label: "一审错误",
      example: "你认为一审判决在事实认定、证据采信或法律适用上错在哪里？",
    },
    {
      id: "appeal_request",
      label: "上诉请求",
      example: "你希望二审法院具体撤销、改判或变更哪几项内容？",
    },
    {
      id: "appeal_basis",
      label: "上诉依据",
      example: "支撑上诉请求的关键事实、证据和法律理由分别是什么？",
    },
    {
      id: "new_evidence",
      label: "新证据",
      example: "二审有没有新证据需要提交？为什么一审没有提交？",
    },
    {
      id: "appeal_goal",
      label: "改判目标",
      example: "如果二审不能完全支持上诉，哪些调整结果可以接受？",
    },
  ],
  AR: [
    {
      id: "appeal_reasons",
      label: "上诉理由",
      example: "对方上诉主要不服一审判决的哪几项？",
    },
    {
      id: "first_instance_basis",
      label: "一审依据",
      example: "一审判决支持我方立场的关键事实和证据是什么？",
    },
    {
      id: "point_by_point_response",
      label: "逐项反驳",
      example: "对方每一项上诉理由，你认为哪里不成立？",
    },
    {
      id: "new_evidence_response",
      label: "新证据应对",
      example: "对方二审是否提交新证据？我方如何质证或回应？",
    },
    {
      id: "response_goal",
      label: "答辩目标",
      example: "我方是请求驳回上诉、维持原判，还是接受部分调整？",
    },
    {
      id: "risk_bottom_line",
      label: "风险底线",
      example: "如果二审法院不完全维持原判，哪些结果可以接受？",
    },
  ],
};
const DOCUMENT_STAGES = new Set(Object.keys(DOCUMENT_FOLLOWUP_HINTS_BY_STAGE));

type Props = {
  documentSkill?: PlayerLawyerSkill | null;
  initialFollowupHistory?: DocumentFollowupPair[];
  loading: boolean;
  onClose: () => void;
  onFollowupDocument: (input: {
    message: string;
  }) => Promise<{ question: string; answer: string }>;
  onPolishDocument: (input: {
    documentText: string;
    followupHistory: DocumentFollowupPair[];
  }) => Promise<string>;
  onPolishText: (input: {
    originalMessage: string;
    hintIds: string[];
  }) => Promise<string>;
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

type DocumentMode = "followup" | "drafting";

export function PlayerLawyerInputDialog({
  documentSkill,
  initialFollowupHistory = [],
  loading,
  onClose,
  onFollowupDocument,
  onPolishDocument,
  onPolishText,
  onSubmitDocument,
  onSubmitText,
  request,
}: Props) {
  const formRef = useRef<HTMLFormElement | null>(null);
  const [message, setMessage] = useState("");
  const [selectedHints, setSelectedHints] = useState<string[]>([]);
  const [polishedMessage, setPolishedMessage] = useState("");
  const [polishError, setPolishError] = useState("");
  const [followupQuestion, setFollowupQuestion] = useState("");
  const [followupHistory, setFollowupHistory] = useState<
    DocumentFollowupPair[]
  >([]);
  const [documentMode, setDocumentMode] = useState<DocumentMode>("followup");

  useEffect(() => {
    setMessage("");
    setSelectedHints([]);
    setPolishedMessage("");
    setPolishError("");
    setFollowupQuestion("");
    setDocumentMode("followup");
    setFollowupHistory(initialFollowupHistory);
  }, [request?.requestId]);

  if (!request) return null;

  const stage = String(
    request.stage || "",
  ).toUpperCase() as keyof typeof DOCUMENT_FOLLOWUP_HINTS_BY_STAGE;
  const documentStage = DOCUMENT_STAGES.has(stage);
  const documentFollowupHints =
    DOCUMENT_FOLLOWUP_HINTS_BY_STAGE[stage] ||
    DOCUMENT_FOLLOWUP_HINTS_BY_STAGE.CD;
  const canStartDocumentDraft =
    followupHistory.length >= MIN_DOCUMENT_FOLLOWUPS_BEFORE_DRAFTING;
  const showDocumentDrafting = documentStage && documentMode === "drafting";

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();
    if (!message.trim()) return;
    if (documentStage) {
      if (!showDocumentDrafting || !canStartDocumentDraft) {
        setPolishError(
          `请先完成至少 ${MIN_DOCUMENT_FOLLOWUPS_BEFORE_DRAFTING} 轮追问，再开始起草文书。`,
        );
        return;
      }
      setPolishError("");
      try {
        await onSubmitDocument({ documentText: message.trim() });
      } catch (err) {
        setPolishError(err instanceof Error ? err.message : "提交文书失败");
      }
      return;
    }
    const finalMessage = (polishedMessage || message).trim();
    setPolishError("");
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
      setPolishError(err instanceof Error ? err.message : "提交回复失败");
    }
  }

  function toggleHint(hintId: string): void {
    setSelectedHints((current) =>
      current.includes(hintId)
        ? current.filter((item) => item !== hintId)
        : [...current, hintId],
    );
  }

  async function handlePolish(): Promise<void> {
    if (!message.trim()) return;
    setPolishError("");
    try {
      const next = await onPolishText({
        originalMessage: message.trim(),
        hintIds: selectedHints,
      });
      setPolishedMessage(next);
    } catch (err) {
      setPolishError(err instanceof Error ? err.message : "AI 润色失败");
    }
  }

  async function handleDocumentPolish(): Promise<void> {
    if (!message.trim()) return;
    setPolishError("");
    try {
      const next = (
        await onPolishDocument({
          documentText: message.trim(),
          followupHistory,
        })
      ).trim();
      if (next) setMessage(next);
    } catch (err) {
      setPolishError(err instanceof Error ? err.message : "智能体润色失败");
    }
  }

  async function handleDocumentFollowup(): Promise<void> {
    const question = followupQuestion.trim();
    if (!question) return;
    setPolishError("");
    try {
      const next = await onFollowupDocument({ message: question });
      setFollowupHistory((current) => [
        ...current,
        {
          question: next.question || question,
          answer: next.answer || "当事人暂未补充更多信息。",
        },
      ]);
      setFollowupQuestion("");
    } catch (err) {
      setPolishError(err instanceof Error ? err.message : "追问当事人失败");
    }
  }

  function startDocumentDrafting(): void {
    if (!canStartDocumentDraft) {
      setPolishError(
        `请先完成至少 ${MIN_DOCUMENT_FOLLOWUPS_BEFORE_DRAFTING} 轮追问，再开始起草文书。`,
      );
      return;
    }
    setPolishError("");
    setDocumentMode("drafting");
  }

  function applyTemplate(): void {
    const templateText = String(documentSkill?.templateText || "").trim();
    if (!templateText) return;
    if (
      message.trim() &&
      !window.confirm("当前输入框已有内容。要用参考模板替换现有内容吗？")
    ) {
      return;
    }
    setMessage(templateText);
  }

  const meta = (
    <>
      <span>{request.caseId}</span>
      <span>{request.stage}</span>
      <span>{request.speakerLabel || request.role}</span>
    </>
  );

  const leftPane = (
    <div className="player-workbench-assist">
      <MarkdownText
        className="player-lawyer-context"
        text={request.contextSummary}
      />
      <MarkdownText
        className="player-lawyer-prompt"
        fallback="请根据当前案件进展输入当前角色回复。"
        text={request.prompt}
      />
      <div
        className="response-assist-explain"
        aria-label={documentStage ? "文书辅助机制说明" : "回复辅助机制说明"}
      >
        <strong>{documentStage ? "文书辅助机制" : "回复辅助机制"}</strong>
        {documentStage ? (
          <>
            <p>
              文书阶段先补事实，再起草。请先完成至少{" "}
              {MIN_DOCUMENT_FOLLOWUPS_BEFORE_DRAFTING} 轮当事人追问，
              补齐事实、金额、证据或诉讼立场。
            </p>
            <p>
              达到追问轮数后再进入起草区，系统会保留模板、智能体润色和手写确认。
            </p>
          </>
        ) : (
          <>
            <p>
              下方提示只是写作方向，不会直接调用智能助手规则。点击“AI
              润色”时，系统才会结合用户原文、 提示方向和案件上下文进行润色。
            </p>
            <p>
              提交时会保存用户原文、最终提交文本、是否使用 AI 润色和提示方向。
            </p>
          </>
        )}
      </div>
      {!documentStage ? (
        <div className="response-hint-row" aria-label="回复提示">
          {RESPONSE_HINTS.map((hint) => (
            <button
              className={`response-hint-chip ${selectedHints.includes(hint.id) ? "selected" : ""}`}
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
      ) : null}
      {documentStage ? (
        <section className="document-followup-panel" aria-label="追问当事人">
          <div className="document-followup-header">
            <strong>追问当事人</strong>
            <span>
              已完成 {followupHistory.length}/
              {MIN_DOCUMENT_FOLLOWUPS_BEFORE_DRAFTING} 轮必需追问； 满 2
              轮后可以开始起草，也可以继续追问。
            </span>
          </div>
          <div className="document-followup-hints" aria-label="追问提示">
            <span className="document-followup-hints-title">参考追问方向</span>
            <div className="document-followup-hints-grid">
              {documentFollowupHints.map((hint) => (
                <div className="document-followup-hint-card" key={hint.id}>
                  <strong>{hint.label}</strong>
                  <span>{hint.example}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="document-followup-history" aria-label="追问记录">
            {followupHistory.length > 0 ? (
              followupHistory.map((item, index) => (
                <article key={`${index}-${item.question}`}>
                  <strong>
                    第 {index + 1} 问：{item.question}
                  </strong>
                  <span>答：{item.answer}</span>
                </article>
              ))
            ) : (
              <p className="document-followup-empty">
                尚未追问。可参考上方问法，自己写下要补充核实的问题。
              </p>
            )}
          </div>
        </section>
      ) : null}
    </div>
  );

  const rightPane = (
    <form
      className="player-workbench-form"
      onSubmit={handleSubmit}
      ref={formRef}
    >
      {showDocumentDrafting ? (
        <section className="document-template-reference" aria-label="参考模板">
          <div className="document-template-header">
            <div>
              <strong>参考模板</strong>
              <span>{documentSkill?.templateTitle || "当前阶段文书模板"}</span>
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
                {loading ? "处理中" : "智能体润色"}
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
      ) : null}
      {showDocumentDrafting ? (
        <textarea
          autoFocus
          className="player-workbench-editor"
          disabled={loading}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="请写入完整文书正文，或先套用参考模板后修改。"
          value={message}
        />
      ) : documentStage ? (
        <div className="document-followup-row">
          <textarea
            autoFocus
            className="player-workbench-editor document-followup-editor"
            disabled={loading}
            onChange={(event) => setFollowupQuestion(event.target.value)}
            placeholder="写下要向当事人追问的一个具体问题。"
            value={followupQuestion}
          />
          {canStartDocumentDraft ? (
            <button
              className="secondary-action"
              disabled={loading}
              onClick={startDocumentDrafting}
              type="button"
            >
              开始起草
            </button>
          ) : null}
        </div>
      ) : (
        <textarea
          autoFocus
          className="player-workbench-editor"
          disabled={loading}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="请写下你准备让当前角色表达的回复要点。"
          value={message}
        />
      )}
      {!documentStage && polishedMessage ? (
        <label className="polished-response-field">
          <span>润色稿，可继续修改</span>
          <textarea
            disabled={loading}
            onChange={(event) => setPolishedMessage(event.target.value)}
            value={polishedMessage}
          />
        </label>
      ) : null}
      {polishError ? (
        <div className="document-error" role="alert">
          {polishError}
        </div>
      ) : null}
    </form>
  );

  const footer = (
    <>
      <button
        className="secondary-action"
        disabled={loading}
        onClick={onClose}
        type="button"
      >
        稍后处理
      </button>
      {!documentStage ? (
        <button
          className="secondary-action"
          disabled={loading || !message.trim()}
          onClick={handlePolish}
          type="button"
        >
          {loading ? "处理中" : "AI 润色"}
        </button>
      ) : showDocumentDrafting ? (
        <button
          className="secondary-action"
          disabled={loading || !message.trim()}
          onClick={handleDocumentPolish}
          type="button"
        >
          {loading ? "处理中" : "智能体润色"}
        </button>
      ) : null}
      {documentStage && documentMode === "followup" ? (
        <button
          className="primary-action"
          disabled={loading || !followupQuestion.trim()}
          onClick={handleDocumentFollowup}
          type="button"
        >
          {loading ? "追问中" : "提交追问"}
        </button>
      ) : (
        <button
          className="primary-action"
          disabled={
            loading ||
            !message.trim() ||
            (documentStage && !canStartDocumentDraft)
          }
          onClick={() => formRef.current?.requestSubmit()}
          type="button"
        >
          {loading ? "提交中" : documentStage ? "提交文书并继续" : "提交回复"}
        </button>
      )}
    </>
  );

  return (
    <TaskWorkbenchShell
      ariaLabel="当前角色输入"
      left={leftPane}
      right={rightPane}
      footer={footer}
      kicker="User Turn"
      meta={meta}
      onClose={onClose}
      title={documentStage ? "文书阶段任务" : "轮到用户处理当前角色发言"}
    />
  );
}
