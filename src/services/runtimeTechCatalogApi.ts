import { authenticatedFetch, readJsonResponse } from './apiClient';
import type { RuntimeTechCatalog, RuntimeTechCatalogItem } from './types';

type RuntimeTechCatalogItemResponse = {
  id?: string;
  display_name?: string;
  category?: string;
  description?: string;
  runtime_status?: string;
};

type RuntimeTechCatalogResponse = {
  tools?: {
    core?: RuntimeTechCatalogItemResponse[];
    extension?: RuntimeTechCatalogItemResponse[];
  };
  skills?: {
    runtime?: RuntimeTechCatalogItemResponse[];
  };
};

function mapCatalogItem(payload: RuntimeTechCatalogItemResponse): RuntimeTechCatalogItem {
  return {
    id: String(payload.id || '').trim(),
    displayName: String(payload.display_name || payload.id || '').trim(),
    category: String(payload.category || '').trim(),
    description: String(payload.description || '').trim(),
    runtimeStatus: String(payload.runtime_status || '').trim(),
  };
}

function mapCatalogItems(value: unknown): RuntimeTechCatalogItem[] {
  return Array.isArray(value)
    ? value.map((item) => mapCatalogItem(item || {})).filter((item) => item.id)
    : [];
}

export async function fetchRuntimeTechCatalog(): Promise<RuntimeTechCatalog> {
  const response = await authenticatedFetch('/api/runtime-tech-catalog', { method: 'GET' });
  const payload = await readJsonResponse<RuntimeTechCatalogResponse>(response);
  return {
    tools: {
      core: mapCatalogItems(payload.tools?.core),
      extension: mapCatalogItems(payload.tools?.extension),
    },
    skills: {
      runtime: mapCatalogItems(payload.skills?.runtime),
    },
  };
}
