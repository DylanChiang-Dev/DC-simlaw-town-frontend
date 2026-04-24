import { authenticatedFetch, readJsonResponse } from './apiClient';
import type { CaseDocumentEntry } from './types';

type CaseDocumentResponse = {
  document_key: string;
  stage: string;
  document_type: string;
  title: string;
  file_name: string;
  available: boolean;
  download_url: string;
};

function mapCaseDocument(caseId: string, payload: CaseDocumentResponse): CaseDocumentEntry {
  return {
    caseId,
    documentKey: String(payload.document_key || '').trim(),
    stage: String(payload.stage || '').trim(),
    documentType: String(payload.document_type || '').trim(),
    title: String(payload.title || '').trim(),
    fileName: String(payload.file_name || '').trim(),
    available: Boolean(payload.available),
    downloadUrl: String(payload.download_url || '').trim(),
  };
}

function sanitizeDownloadFilename(fileName: string): string {
  const normalized = String(fileName || '').trim().replace(/[\\/:*?"<>|]+/g, '-');
  return normalized || 'case-document.pdf';
}

export async function fetchCaseDocuments(caseId: string): Promise<CaseDocumentEntry[]> {
  const normalizedCaseId = String(caseId || '').trim();
  const response = await authenticatedFetch(`/api/sandbox/cases/${encodeURIComponent(normalizedCaseId)}/documents`, { method: 'GET' });
  const payload = await readJsonResponse<{ case_id?: string; documents?: CaseDocumentResponse[] }>(response);
  return Array.isArray(payload.documents)
    ? payload.documents.map((item) => mapCaseDocument(payload.case_id || normalizedCaseId, item))
    : [];
}

export async function downloadCaseDocument(entry: Pick<CaseDocumentEntry, 'downloadUrl' | 'fileName'>): Promise<void> {
  const response = await authenticatedFetch(entry.downloadUrl, { method: 'GET' });
  if (!response.ok) {
    await readJsonResponse<Record<string, never>>(response);
    return;
  }

  const blob = await response.blob();
  const href = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = href;
  link.download = sanitizeDownloadFilename(entry.fileName);
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(href);
}
