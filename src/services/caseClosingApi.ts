import { authenticatedFetch, readJsonResponse } from './apiClient';
import type {
  CaseClosingEvaluation,
  CaseClosingPlayerTurn,
  CaseClosingSummary,
  CaseDocumentEntry,
} from './types';

type CaseClosingEvaluationResponse = {
  overall_score?: number;
  summary?: string;
  dimensions?: Array<{
    label?: string;
    score?: number;
    max_score?: number;
    maxScore?: number;
  }>;
  strengths?: string[];
  improvements?: string[];
  generated_at?: string;
  generatedAt?: string;
};

type CaseClosingPlayerTurnResponse = {
  request_id?: string;
  requestId?: string;
  stage?: string;
  role?: string;
  speaker_label?: string;
  speakerLabel?: string;
  prompt?: string;
  context_summary?: string;
  contextSummary?: string;
  final_message?: string;
  finalMessage?: string;
  user_original_message?: string;
  userOriginalMessage?: string;
  created_at?: string;
  createdAt?: string;
  resolved_at?: string;
  resolvedAt?: string;
};

type CaseClosingDocumentResponse = {
  document_key?: string;
  documentKey?: string;
  stage?: string;
  document_type?: string;
  documentType?: string;
  title?: string;
  file_name?: string;
  fileName?: string;
  available?: boolean;
  download_url?: string;
  downloadUrl?: string;
};

type CaseClosingSummaryResponse = {
  case_id?: string;
  caseId?: string;
  case?: {
    title?: string;
    plaintiff_name?: string;
    plaintiffName?: string;
    defendant_name?: string;
    defendantName?: string;
    training_category?: string;
    trainingCategory?: string;
    difficulty?: string;
  };
  documents?: CaseClosingDocumentResponse[];
  document_count?: number;
  documentCount?: number;
  player_turns?: CaseClosingPlayerTurnResponse[];
  playerTurns?: CaseClosingPlayerTurnResponse[];
  player_turn_count?: number;
  playerTurnCount?: number;
  evaluation?: CaseClosingEvaluationResponse | null;
};

function stringList(value: unknown): string[] {
  return Array.isArray(value)
    ? value.map((item) => String(item || '').trim()).filter(Boolean)
    : [];
}

function mapEvaluation(payload?: CaseClosingEvaluationResponse | null): CaseClosingEvaluation | null {
  if (!payload) return null;
  return {
    overallScore: Number(payload.overall_score ?? 0),
    summary: String(payload.summary || ''),
    dimensions: Array.isArray(payload.dimensions)
      ? payload.dimensions.map((item) => ({
        label: String(item.label || ''),
        score: Number(item.score || 0),
        maxScore: Number(item.max_score ?? item.maxScore ?? 0),
      }))
      : [],
    strengths: stringList(payload.strengths),
    improvements: stringList(payload.improvements),
    generatedAt: String(payload.generated_at || payload.generatedAt || ''),
  };
}

function mapDocument(caseId: string, payload: CaseClosingDocumentResponse): CaseDocumentEntry {
  return {
    caseId,
    documentKey: String(payload.document_key || payload.documentKey || '').trim(),
    stage: String(payload.stage || '').trim(),
    documentType: String(payload.document_type || payload.documentType || '').trim(),
    title: String(payload.title || '').trim(),
    fileName: String(payload.file_name || payload.fileName || '').trim(),
    available: Boolean(payload.available),
    downloadUrl: String(payload.download_url || payload.downloadUrl || '').trim(),
  };
}

function mapPlayerTurn(payload: CaseClosingPlayerTurnResponse): CaseClosingPlayerTurn {
  return {
    requestId: String(payload.request_id || payload.requestId || '').trim(),
    stage: String(payload.stage || '').trim(),
    role: String(payload.role || '').trim(),
    speakerLabel: String(payload.speaker_label || payload.speakerLabel || '').trim(),
    prompt: String(payload.prompt || ''),
    contextSummary: String(payload.context_summary || payload.contextSummary || ''),
    finalMessage: String(payload.final_message || payload.finalMessage || ''),
    userOriginalMessage: String(payload.user_original_message || payload.userOriginalMessage || ''),
    createdAt: String(payload.created_at || payload.createdAt || ''),
    resolvedAt: String(payload.resolved_at || payload.resolvedAt || ''),
  };
}

function mapSummary(payload: CaseClosingSummaryResponse): CaseClosingSummary {
  const caseId = String(payload.case_id || payload.caseId || '').trim();
  const casePayload = payload.case || {};
  const documents = Array.isArray(payload.documents)
    ? payload.documents.map((item) => mapDocument(caseId, item))
    : [];
  const playerTurns = Array.isArray(payload.player_turns || payload.playerTurns)
    ? (payload.player_turns || payload.playerTurns || []).map(mapPlayerTurn)
    : [];
  return {
    caseId,
    case: {
      title: String(casePayload.title || ''),
      plaintiffName: String(casePayload.plaintiff_name || casePayload.plaintiffName || ''),
      defendantName: String(casePayload.defendant_name || casePayload.defendantName || ''),
      trainingCategory: String(casePayload.training_category || casePayload.trainingCategory || ''),
      difficulty: String(casePayload.difficulty || ''),
    },
    documents,
    documentCount: Number(payload.document_count ?? payload.documentCount ?? documents.filter((item) => item.available).length),
    playerTurns,
    playerTurnCount: Number(payload.player_turn_count ?? payload.playerTurnCount ?? playerTurns.length),
    evaluation: mapEvaluation(payload.evaluation),
  };
}

export async function fetchCaseClosingSummary(caseId: string): Promise<CaseClosingSummary> {
  const normalizedCaseId = String(caseId || '').trim();
  const response = await authenticatedFetch(`/api/sandbox/cases/${encodeURIComponent(normalizedCaseId)}/closing-summary`, { method: 'GET' });
  const payload = await readJsonResponse<CaseClosingSummaryResponse>(response);
  return mapSummary(payload);
}

export async function generateCaseClosingEvaluation(caseId: string): Promise<CaseClosingEvaluation> {
  const normalizedCaseId = String(caseId || '').trim();
  const response = await authenticatedFetch(`/api/sandbox/cases/${encodeURIComponent(normalizedCaseId)}/closing-evaluation`, { method: 'POST' });
  const payload = await readJsonResponse<{ success?: boolean; evaluation?: CaseClosingEvaluationResponse }>(response);
  const evaluation = mapEvaluation(payload.evaluation);
  if (!evaluation) {
    throw new Error('结案评价响应为空');
  }
  return evaluation;
}

export async function downloadPlayerRunReportMarkdown(caseId: string): Promise<void> {
  const normalizedCaseId = String(caseId || '').trim();
  const response = await authenticatedFetch(`/api/sandbox/cases/${encodeURIComponent(normalizedCaseId)}/player-run-report.md`, {
    method: 'GET',
  });
  if (!response.ok) {
    const payload = await readJsonResponse<{ detail?: string }>(response).catch(() => ({ detail: '' }));
    throw new Error(payload.detail || '下载复盘报告失败');
  }
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${normalizedCaseId || 'case'}-player-run-report.md`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(url);
}
