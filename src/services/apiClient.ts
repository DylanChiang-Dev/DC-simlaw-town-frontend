import { getAuthService } from './auth';
import { buildApiUrl, getWebSocketUrl } from './runtime';

const REFRESH_WINDOW_MS = 10 * 60 * 1000;
let refreshAccessTokenPromise: Promise<string> | null = null;

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const payload = await response.json() as { detail?: string; message?: string };
    return payload.detail || payload.message || `请求失败 (${response.status})`;
  } catch {
    return `请求失败 (${response.status})`;
  }
}

async function refreshAccessTokenIfNeeded(): Promise<string> {
  const authService = getAuthService();
  const token = authService.getAccessToken();
  if (!token || !authService.willExpireWithin(REFRESH_WINDOW_MS)) {
    return token;
  }

  if (refreshAccessTokenPromise) {
    return await refreshAccessTokenPromise;
  }

  refreshAccessTokenPromise = (async () => {
    const response = await fetch(buildApiUrl('/api/auth/refresh'), {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.status === 401) {
      authService.logout();
      throw new Error(await readErrorMessage(response));
    }

    if (!response.ok) {
      return token;
    }

    const payload = await response.json() as {
      access_token?: string;
      expires_at?: string;
      user?: { id?: string; email?: string; status?: string; token_version?: number; tokenVersion?: number };
    };
    const session = authService.saveTokenResponse(payload);
    return session?.accessToken || token;
  })().finally(() => {
    refreshAccessTokenPromise = null;
  });

  return await refreshAccessTokenPromise;
}

export async function readJsonResponse<T>(response: Response): Promise<T> {
  const payload = await response.json() as T & { detail?: string; message?: string };
  if (!response.ok) {
    throw new Error(payload.detail || payload.message || `请求失败 (${response.status})`);
  }
  return payload;
}

export async function authenticatedFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const token = await refreshAccessTokenIfNeeded();
  const headers = {
    ...(init.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const response = await fetch(path.startsWith('http') ? path : buildApiUrl(path), {
    ...init,
    headers,
  });

  if (response.status === 401) {
    getAuthService().logout();
    throw new Error(await readErrorMessage(response));
  }

  return response;
}

export async function buildAuthenticatedWebSocketUrl(url: string = getWebSocketUrl()): Promise<string> {
  const token = await refreshAccessTokenIfNeeded();
  if (!token) {
    return url;
  }
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}token=${encodeURIComponent(token)}`;
}

export async function login(email: string, password: string) {
  const response = await fetch(buildApiUrl('/api/auth/login'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const payload = await readJsonResponse<{
    access_token?: string;
    expires_at?: string;
    user?: { id?: string; email?: string; status?: string; token_version?: number; tokenVersion?: number };
  }>(response);
  const session = getAuthService().saveTokenResponse(payload);
  if (!session) {
    throw new Error('登录响应缺少会话信息');
  }
  return session;
}

export async function fetchCurrentUser() {
  const response = await authenticatedFetch('/api/auth/me', { method: 'GET' });
  return await readJsonResponse<{ id: string; email: string; status: string; token_version?: number; tokenVersion?: number }>(response);
}
