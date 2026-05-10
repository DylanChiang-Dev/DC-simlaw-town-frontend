import { authenticatedFetch, readJsonResponse } from './apiClient';

export type HumanEvalMetricScore = {
  score: number;
  reason: string;
};

export type HumanEvalStageScore = {
  procedural_compliance: HumanEvalMetricScore;
  process_coherence: HumanEvalMetricScore;
};

export type HumanEvalRatingPayload = {
  rater_id: string;
  status: 'draft' | 'submitted';
  stage_scores: Record<string, HumanEvalStageScore>;
  role_scores: Record<string, HumanEvalMetricScore>;
};

export type HumanEvalCaseSummary = {
  case_id: number;
  case_key: string;
  case_cause: string;
  message_count: number;
  rating_status: 'not_started' | 'draft' | 'submitted';
  rating_updated_at?: string | null;
  rating_submitted_at?: string | null;
};

export type HumanEvalAssignment = {
  batch_size: number;
  assigned_case_ids: number[];
  submitted_count: number;
  total_count: number;
  completed: boolean;
  batch_number: number;
};

export type HumanEvalCasesPayload = {
  assigned_cases: HumanEvalCaseSummary[];
  all_cases: HumanEvalCaseSummary[];
  cases?: HumanEvalCaseSummary[];
  assignment: HumanEvalAssignment;
};

export async function fetchHumanEvalCases() {
  const response = await authenticatedFetch('/api/human-eval/cases');
  return await readJsonResponse<HumanEvalCasesPayload>(response);
}

export async function fetchHumanEvalCase(caseId: number) {
  const response = await authenticatedFetch(`/api/human-eval/cases/${caseId}`);
  return await readJsonResponse<{ case: unknown }>(response);
}

export async function fetchHumanEvalSchema() {
  const response = await authenticatedFetch('/api/human-eval/schema');
  return await readJsonResponse<{ schema: unknown }>(response);
}

export async function fetchHumanEvalRating(caseId: number) {
  const response = await authenticatedFetch(`/api/human-eval/ratings/${caseId}`);
  return await readJsonResponse<{ rating: unknown | null }>(response);
}

export async function saveHumanEvalRating(caseId: number, payload: HumanEvalRatingPayload) {
  const response = await authenticatedFetch(`/api/human-eval/ratings/${caseId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return await readJsonResponse<{ rating: unknown }>(response);
}
