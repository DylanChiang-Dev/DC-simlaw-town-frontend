import { authenticatedFetch, readJsonResponse } from './apiClient';
import type {
  PlayerLawyerDocumentAssistInput,
  PlayerLawyerDocumentConfirmInput,
  PlayerLawyerDocumentDraft,
  PlayerLawyerRequest,
  PlayerLawyerSkill,
  PlayerLawyerStatus,
} from './types';

type PlayerLawyerRequestResponse = {
  request_id?: string;
  sandbox_id?: number;
  case_id?: string;
  stage?: string;
  role?: string;
  speaker_label?: string;
  prompt?: string;
  context_summary?: string;
  status?: string;
  message?: string;
  created_at?: string;
  submitted_at?: string | null;
};

type PlayerLawyerSkillResponse = {
  skill_id?: string;
  document_type?: string;
  name?: string;
  description?: string;
  path?: string;
};

type PlayerLawyerDocumentDraftResponse = {
  draft_id?: string;
  request_id?: string;
  sandbox_id?: number;
  case_id?: string;
  document_type?: string;
  skill_id?: string;
  player_prompt?: string;
  player_draft?: string;
  document_text?: string;
  confirmed?: boolean;
  finish_reason?: string;
  pdf_path?: string;
  created_at?: string;
  confirmed_at?: string | null;
};

function mapRequest(payload: PlayerLawyerRequestResponse): PlayerLawyerRequest {
  return {
    requestId: String(payload.request_id || '').trim(),
    sandboxId: Number(payload.sandbox_id || 0),
    caseId: String(payload.case_id || '').trim(),
    stage: String(payload.stage || '').trim(),
    role: String(payload.role || '').trim(),
    speakerLabel: String(payload.speaker_label || '').trim(),
    prompt: String(payload.prompt || ''),
    contextSummary: String(payload.context_summary || ''),
    status: String(payload.status || '').trim(),
    message: String(payload.message || ''),
    createdAt: String(payload.created_at || ''),
    submittedAt: payload.submitted_at ?? null,
  };
}

function mapSkill(payload: PlayerLawyerSkillResponse): PlayerLawyerSkill {
  return {
    skillId: String(payload.skill_id || '').trim(),
    documentType: String(payload.document_type || '').trim(),
    name: String(payload.name || '').trim(),
    description: String(payload.description || '').trim(),
    path: String(payload.path || '').trim(),
  };
}

function mapDraft(payload: PlayerLawyerDocumentDraftResponse): PlayerLawyerDocumentDraft {
  return {
    draftId: String(payload.draft_id || '').trim(),
    requestId: String(payload.request_id || '').trim(),
    sandboxId: Number(payload.sandbox_id || 0),
    caseId: String(payload.case_id || '').trim(),
    documentType: String(payload.document_type || '').trim(),
    skillId: String(payload.skill_id || '').trim(),
    playerPrompt: String(payload.player_prompt || ''),
    playerDraft: String(payload.player_draft || ''),
    documentText: String(payload.document_text || ''),
    confirmed: Boolean(payload.confirmed),
    finishReason: String(payload.finish_reason || ''),
    pdfPath: String(payload.pdf_path || ''),
    createdAt: String(payload.created_at || ''),
    confirmedAt: payload.confirmed_at ?? null,
  };
}

export async function fetchPlayerLawyerStatus(): Promise<PlayerLawyerStatus> {
  const response = await authenticatedFetch('/api/sandbox/player-lawyer/status', { method: 'GET' });
  const payload = await readJsonResponse<{ player_mode?: string; enabled?: boolean }>(response);
  return {
    playerMode: String(payload.player_mode || '').trim(),
    enabled: Boolean(payload.enabled),
  };
}

export async function fetchPendingPlayerLawyerRequests(caseId?: string): Promise<PlayerLawyerRequest[]> {
  const query = caseId ? `?case_id=${encodeURIComponent(caseId)}` : '';
  const response = await authenticatedFetch(`/api/sandbox/player-lawyer/pending${query}`, { method: 'GET' });
  const payload = await readJsonResponse<{ pending?: PlayerLawyerRequestResponse[] }>(response);
  return Array.isArray(payload.pending) ? payload.pending.map(mapRequest) : [];
}

export async function submitPlayerLawyerResponse(requestId: string, message: string): Promise<PlayerLawyerRequest> {
  const response = await authenticatedFetch('/api/sandbox/player-lawyer/respond', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ request_id: requestId, message }),
  });
  const payload = await readJsonResponse<{ request?: PlayerLawyerRequestResponse }>(response);
  return mapRequest(payload.request || {});
}

export async function fetchPlayerLawyerDocumentSkills(): Promise<PlayerLawyerSkill[]> {
  const response = await authenticatedFetch('/api/sandbox/player-lawyer/document-skills', { method: 'GET' });
  const payload = await readJsonResponse<{ skills?: PlayerLawyerSkillResponse[] }>(response);
  return Array.isArray(payload.skills) ? payload.skills.map(mapSkill) : [];
}

export async function createPlayerLawyerDocumentDraft(input: PlayerLawyerDocumentAssistInput): Promise<PlayerLawyerDocumentDraft> {
  const response = await authenticatedFetch('/api/sandbox/player-lawyer/document-assist', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      case_id: input.caseId,
      document_type: input.documentType,
      skill_id: input.skillId,
      player_prompt: input.playerPrompt,
      player_draft: input.playerDraft || '',
      request_id: input.requestId || '',
    }),
  });
  const payload = await readJsonResponse<{ draft?: PlayerLawyerDocumentDraftResponse }>(response);
  return mapDraft(payload.draft || {});
}

export async function confirmPlayerLawyerDocumentDraft(input: PlayerLawyerDocumentConfirmInput): Promise<PlayerLawyerDocumentDraft> {
  const response = await authenticatedFetch(`/api/sandbox/player-lawyer/documents/${encodeURIComponent(input.draftId)}/confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ document_text: input.documentText }),
  });
  const payload = await readJsonResponse<{ draft?: PlayerLawyerDocumentDraftResponse }>(response);
  return mapDraft(payload.draft || {});
}
