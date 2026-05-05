import { authenticatedFetch, readJsonResponse } from './apiClient';
import type {
  PlayerLawyerDocumentAssistInput,
  PlayerLawyerDocumentConfirmInput,
  PlayerLawyerDocumentDraft,
  PlayerLawyerDocumentFollowup,
  PlayerLawyerDocumentFollowupInput,
  PlayerLawyerManualDocumentConfirmInput,
  PlayerLawyerPolishInput,
  PlayerLawyerRequest,
  PlayerLawyerResponseAssist,
  PlayerLawyerSkill,
  PlayerLawyerStatus,
  PlayerLawyerTextSubmitInput,
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
  template_title?: string;
  template_text?: string;
  quality_check?: string[];
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

type PlayerLawyerResponseAssistResponse = {
  request_id?: string;
  sandbox_id?: number;
  case_id?: string;
  stage?: string;
  role?: string;
  speaker_label?: string;
  prompt?: string;
  context_summary?: string;
  hint_ids?: string[];
  user_original_message?: string;
  ai_polished_message?: string;
  final_submitted_message?: string;
  used_ai_polish?: boolean;
  created_at?: string;
  updated_at?: string | null;
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
    templateTitle: String(payload.template_title || '').trim(),
    templateText: String(payload.template_text || ''),
    qualityCheck: Array.isArray(payload.quality_check)
      ? payload.quality_check.map((item) => String(item || '').trim()).filter(Boolean)
      : [],
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

function mapResponseAssist(payload: PlayerLawyerResponseAssistResponse): PlayerLawyerResponseAssist {
  return {
    requestId: String(payload.request_id || '').trim(),
    sandboxId: Number(payload.sandbox_id || 0),
    caseId: String(payload.case_id || '').trim(),
    stage: String(payload.stage || '').trim(),
    role: String(payload.role || '').trim(),
    speakerLabel: String(payload.speaker_label || '').trim(),
    prompt: String(payload.prompt || ''),
    contextSummary: String(payload.context_summary || ''),
    hintIds: Array.isArray(payload.hint_ids) ? payload.hint_ids.map((item) => String(item || '').trim()).filter(Boolean) : [],
    userOriginalMessage: String(payload.user_original_message || ''),
    aiPolishedMessage: String(payload.ai_polished_message || ''),
    finalSubmittedMessage: String(payload.final_submitted_message || ''),
    usedAiPolish: Boolean(payload.used_ai_polish),
    createdAt: String(payload.created_at || ''),
    updatedAt: payload.updated_at ?? null,
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

export async function submitPlayerLawyerResponse(input: PlayerLawyerTextSubmitInput): Promise<PlayerLawyerRequest> {
  const response = await authenticatedFetch('/api/sandbox/player-lawyer/respond', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      request_id: input.requestId,
      message: input.message,
      original_message: input.originalMessage || '',
      polished_message: input.polishedMessage || '',
      final_message: input.finalMessage || input.message,
      hint_ids: input.hintIds || [],
      used_ai_polish: Boolean(input.usedAiPolish),
    }),
  });
  const payload = await readJsonResponse<{ request?: PlayerLawyerRequestResponse }>(response);
  return mapRequest(payload.request || {});
}

export async function polishPlayerLawyerResponse(input: PlayerLawyerPolishInput): Promise<PlayerLawyerResponseAssist> {
  const response = await authenticatedFetch('/api/sandbox/player-lawyer/polish-response', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      request_id: input.requestId,
      original_message: input.originalMessage,
      hint_ids: input.hintIds,
    }),
  });
  const payload = await readJsonResponse<{ assist?: PlayerLawyerResponseAssistResponse }>(response);
  return mapResponseAssist(payload.assist || {});
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

export async function confirmManualPlayerLawyerDocument(input: PlayerLawyerManualDocumentConfirmInput): Promise<PlayerLawyerDocumentDraft> {
  const response = await authenticatedFetch('/api/sandbox/player-lawyer/documents/confirm-manual', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      request_id: input.requestId || '',
      case_id: input.caseId,
      document_type: input.documentType,
      document_text: input.documentText,
    }),
  });
  const payload = await readJsonResponse<{ draft?: PlayerLawyerDocumentDraftResponse }>(response);
  return mapDraft(payload.draft || {});
}

export async function sendPlayerLawyerDocumentFollowup(input: PlayerLawyerDocumentFollowupInput): Promise<PlayerLawyerDocumentFollowup> {
  const response = await authenticatedFetch('/api/sandbox/player-lawyer/document-followup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      request_id: input.requestId,
      message: input.message,
    }),
  });
  const payload = await readJsonResponse<{
    request?: PlayerLawyerRequestResponse;
    question?: string;
    answer?: string;
  }>(response);
  return {
    request: mapRequest(payload.request || {}),
    question: String(payload.question || ''),
    answer: String(payload.answer || ''),
  };
}
