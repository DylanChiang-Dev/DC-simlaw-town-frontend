import { useEffect, useState } from 'react';
import { downloadCaseDocument } from '../services/caseDocumentsApi';
import { downloadPlayerRunReportMarkdown, fetchCaseClosingSummary, generateCaseClosingEvaluation } from '../services/caseClosingApi';
import type { CaseClosingEvaluation, CaseClosingSummary } from '../services/types';
import { MarkdownText } from './MarkdownText';

type Props = {
  caseId: string;
  onClose: () => void;
  open: boolean;
};

const DEFAULT_DIMENSIONS = ['事实把握', '法律论证', '程序/任务完成', '表达与职业沟通'];

export function CaseClosingSummaryDialog({ caseId, onClose, open }: Props) {
  const [summary, setSummary] = useState<CaseClosingSummary | null>(null);
  const [evaluation, setEvaluation] = useState<CaseClosingEvaluation | null>(null);
  const [error, setError] = useState('');
  const [evaluationError, setEvaluationError] = useState('');
  const [loading, setLoading] = useState(false);
  const [evaluationLoading, setEvaluationLoading] = useState(false);
  const [reportError, setReportError] = useState('');
  const [reportLoading, setReportLoading] = useState(false);

  useEffect(() => {
    if (!open || !caseId) return;
    void loadSummaryAndEvaluation();
    // Load once when the dialog opens for a case.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId, open]);

  async function loadSummaryAndEvaluation(): Promise<void> {
    setLoading(true);
    setError('');
    setEvaluationError('');
    try {
      const nextSummary = await fetchCaseClosingSummary(caseId);
      setSummary(nextSummary);
      setEvaluation(nextSummary.evaluation);
      if (!nextSummary.evaluation) {
        void requestEvaluation();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '读取结案总结失败');
    } finally {
      setLoading(false);
    }
  }

  async function requestEvaluation(): Promise<void> {
    if (!caseId) return;
    setEvaluationLoading(true);
    setEvaluationError('');
    try {
      const nextEvaluation = await generateCaseClosingEvaluation(caseId);
      setEvaluation(nextEvaluation);
      setSummary((current) => current ? { ...current, evaluation: nextEvaluation } : current);
    } catch (err) {
      setEvaluationError(err instanceof Error ? err.message : '评价生成失败');
    } finally {
      setEvaluationLoading(false);
    }
  }

  async function handleDownloadReport(): Promise<void> {
    if (!caseId) return;
    setReportLoading(true);
    setReportError('');
    try {
      await downloadPlayerRunReportMarkdown(caseId);
    } catch (err) {
      setReportError(err instanceof Error ? err.message : '下载复盘报告失败');
    } finally {
      setReportLoading(false);
    }
  }

  if (!open) return null;

  const availableDocuments = summary?.documents.filter((item) => item.available) || [];
  const caseTitle = summary?.case.title || caseId || '本轮案件';

  return (
    <div className="modal-layer" role="dialog" aria-modal="true" aria-label="结案总结">
      <section className="case-closing-summary-dialog">
        <button className="close-button" type="button" onClick={onClose} aria-label="关闭">×</button>
        <div className="panel-kicker">Case Closing Review</div>
        <h2>{caseTitle}</h2>
        <div className="closing-summary-meta">
          <span>原告：{summary?.case.plaintiffName || '未记录'}</span>
          <span>被告：{summary?.case.defendantName || '未记录'}</span>
          <span>{summary?.case.trainingCategory || '法律实训'}</span>
          <span>难度：{summary?.case.difficulty || '未标注'}</span>
        </div>

        {error ? <div className="document-error" role="alert">{error}</div> : null}
        {loading ? <div className="empty-case">正在整理本轮资料...</div> : null}

        {summary ? (
          <div className="closing-summary-grid">
            <section className="closing-summary-section">
              <h3>本轮资料</h3>
              <div className="closing-stat-grid">
                <span><strong>{summary.playerTurnCount}</strong>玩家提交</span>
                <span><strong>{summary.documentCount}</strong>可下载文书</span>
                <span><strong>{availableDocuments.length}</strong>已生成 PDF</span>
              </div>
              <div className="closing-document-list">
                {availableDocuments.map((item) => (
                  <article className="closing-document-item" key={item.documentKey}>
                    <div>
                      <strong>{item.title || item.documentKey}</strong>
                      <span>{item.stage} / {item.fileName}</span>
                    </div>
                    <button className="secondary-action" type="button" onClick={() => void downloadCaseDocument(item)}>
                      下载
                    </button>
                  </article>
                ))}
                {!availableDocuments.length ? <div className="empty-case">暂无可下载文书。</div> : null}
              </div>
            </section>

            <section className="closing-summary-section">
              <h3>玩家提交</h3>
              <div className="closing-turn-list">
                {summary.playerTurns.slice(-4).map((turn, index) => (
                  <article className="closing-turn-item" key={turn.requestId || `${turn.stage}-${index}`}>
                    <span>{turn.stage || '阶段'} · {turn.speakerLabel || '原告律师'}</span>
                    <MarkdownText text={turn.finalMessage} />
                  </article>
                ))}
                {!summary.playerTurns.length ? <div className="empty-case">暂无玩家提交记录。</div> : null}
              </div>
            </section>
          </div>
        ) : null}

        <section className="closing-evaluation-section">
          <div className="closing-evaluation-header">
            <h3>玩家表现评价</h3>
            {evaluationLoading ? <span>评价生成中</span> : null}
          </div>
          {evaluation ? (
            <EvaluationView evaluation={evaluation} />
          ) : evaluationLoading ? (
            <div className="closing-evaluation-loading">AI 正在基于本轮提交生成评价...</div>
          ) : evaluationError ? (
            <div className="closing-evaluation-error" role="alert">
              <span>评价生成失败：{evaluationError}</span>
              <button className="secondary-action" type="button" onClick={() => void requestEvaluation()}>
                重新生成评价
              </button>
            </div>
          ) : (
            <div className="closing-evaluation-loading">等待评价生成。</div>
          )}
        </section>

        {reportError ? <div className="document-error" role="alert">{reportError}</div> : null}
        <div className="confirm-dialog-actions">
          <button
            className="secondary-action"
            disabled={reportLoading || loading || !summary}
            onClick={() => void handleDownloadReport()}
            type="button"
          >
            {reportLoading ? '导出中' : '导出复盘 Markdown'}
          </button>
          <button className="primary-action" type="button" onClick={onClose}>关闭</button>
        </div>
      </section>
    </div>
  );
}

function EvaluationView({ evaluation }: { evaluation: CaseClosingEvaluation }) {
  const dimensions = DEFAULT_DIMENSIONS.map((label) => (
    evaluation.dimensions.find((item) => item.label === label) || {
      label,
      score: 0,
      maxScore: 25,
    }
  ));
  return (
    <div className="closing-evaluation-content">
      <div className="closing-score">
        <strong>{evaluation.overallScore}</strong>
        <span>总分</span>
      </div>
      <MarkdownText text={evaluation.summary || '暂无总评。'} />
      <div className="closing-dimension-grid">
        {dimensions.map((item) => (
          <div className="closing-dimension" key={item.label}>
            <span>{item.label}</span>
            <strong>{item.score}/{item.maxScore}</strong>
          </div>
        ))}
      </div>
      <div className="closing-feedback-grid">
        <FeedbackList title="亮点" items={evaluation.strengths} />
        <FeedbackList title="改进建议" items={evaluation.improvements} />
      </div>
    </div>
  );
}

function FeedbackList({ items, title }: { items: string[]; title: string }) {
  return (
    <div className="closing-feedback-list">
      <strong>{title}</strong>
      {items.length ? (
        <ul>
          {items.map((item) => <li key={item}>{item}</li>)}
        </ul>
      ) : (
        <span>暂无记录。</span>
      )}
    </div>
  );
}
