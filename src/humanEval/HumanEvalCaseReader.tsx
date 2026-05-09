type HumanEvalStage = {
  stage_code: string;
  stage_display?: { zh?: string; en?: string };
  messages?: Array<{
    index?: number;
    turn?: number;
    role?: string;
    role_display?: { zh?: string; en?: string };
    content?: string;
  }>;
  documents?: Array<{ title?: string; content?: string; text?: string }>;
  transition?: unknown;
};

type HumanEvalCase = {
  case_id?: number;
  case_key?: string;
  case_cause?: string;
  stages?: HumanEvalStage[];
};

type Props = {
  caseData: HumanEvalCase | null;
  activeStage: string;
  onStageSelect: (stage: string) => void;
};

const DISPLAY_ONLY_STAGE = 'SD';

export function HumanEvalCaseReader({ caseData, activeStage, onStageSelect }: Props) {
  if (!caseData) {
    return <main className="human-eval-reader empty">请选择一个评测案件。</main>;
  }

  const stages = caseData.stages || [];
  const currentStage = stages.find((stage) => stage.stage_code === activeStage) || stages[0];

  return (
    <main className="human-eval-reader" aria-label="人工评测案件材料">
      <header className="human-eval-reader-header">
        <div>
          <div className="panel-kicker">{caseData.case_key}</div>
          <h2>{caseData.case_cause}</h2>
        </div>
        <div className="human-eval-stage-tabs">
          {stages.map((stage) => (
            <button
              className={stage.stage_code === currentStage?.stage_code ? 'active' : ''}
              key={stage.stage_code}
              onClick={() => onStageSelect(stage.stage_code)}
              type="button"
            >
              {stage.stage_code}
            </button>
          ))}
        </div>
      </header>
      {currentStage && (
        <section className="human-eval-stage-material">
          <div className="human-eval-stage-title">
            <h3>{currentStage.stage_display?.zh || currentStage.stage_code}</h3>
            {currentStage.stage_code === DISPLAY_ONLY_STAGE && <span>SD 只展示不评分</span>}
          </div>
          <div className="human-eval-message-list">
            {(currentStage.messages || []).map((message) => (
              <article className="human-eval-message" key={`${currentStage.stage_code}-${message.index}`}>
                <strong>{message.role_display?.zh || message.role || '角色'} · 第{Number(message.turn || 0) + 1}轮</strong>
                <p>{message.content}</p>
              </article>
            ))}
          </div>
          {(currentStage.documents || []).length > 0 && (
            <div className="human-eval-documents">
              <h4>阶段产出</h4>
              {currentStage.documents?.map((document, index) => (
                <pre key={index}>{document.content || document.text || JSON.stringify(document, null, 2)}</pre>
              ))}
            </div>
          )}
        </section>
      )}
    </main>
  );
}
