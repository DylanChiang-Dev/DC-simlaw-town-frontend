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
const DOCUMENT_BREAK_MARKERS = [
  '原告：',
  '被告：',
  '被上诉人',
  '上诉人',
  '法定代表人：',
  '原告诉称',
  '被告辩称',
  '上诉请求',
  '事实和理由',
  '一审法院认定事实',
  '一审法院认为',
  '本院二审期间',
  '本院认为',
  '综上所述',
  '判决如下',
  '驳回上诉',
  '本判决为终审判决',
  '案件受理费',
  '如不服本判决',
  '审判长：',
];

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
              {currentStage.documents?.map((document, index) => {
                const documentText = document.content || document.text || JSON.stringify(document, null, 2);
                const sections = formatLegalDocumentText(documentText);
                const heading = sections[0] || document.title || `阶段文书 ${index + 1}`;
                const body = sections.slice(1);

                return (
                  <article className="human-eval-document-paper" key={index}>
                    <h5>{heading}</h5>
                    {body.map((section, sectionIndex) => (
                      <p className={isDocumentDecisionLine(section) ? 'document-decision-line' : ''} key={`${index}-${sectionIndex}`}>
                        {section}
                      </p>
                    ))}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}
    </main>
  );
}

export function formatLegalDocumentText(source: string): string[] {
  const normalized = String(source || '')
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  if (!normalized) return [];

  const withMarkerBreaks = DOCUMENT_BREAK_MARKERS.reduce((text, marker) => {
    return text.split(marker).join(`\n${marker}`);
  }, normalized)
    .replace(/\s+(一、)/g, '\n$1')
    .replace(/\s+(二、)/g, '\n$1')
    .replace(/\s+(三、)/g, '\n$1')
    .replace(/\s+(四、)/g, '\n$1')
    .replace(/\s+(五、)/g, '\n$1')
    .replace(/\s+([1-9][0-9]?[.．、]\s*)/g, '\n$1')
    .replace(/\n{2,}/g, '\n');

  const sections = withMarkerBreaks
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  return mergeShortDocumentHeading(sections);
}

function mergeShortDocumentHeading(sections: string[]): string[] {
  if (sections.length < 2) return sections;
  if (!/^(民事|刑事|行政|裁定|判决|调解|答辩|上诉)/.test(sections[0])) return sections;
  if (!/^（?\d{4}/.test(sections[1])) return sections;
  return [`${sections[0]} ${sections[1]}`, ...sections.slice(2)];
}

function isDocumentDecisionLine(section: string): boolean {
  return /^(判决如下|驳回上诉|本判决为终审判决|如不服本判决|案件受理费)/.test(section);
}
