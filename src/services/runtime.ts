export type RuntimeMode = {
  apiUrl: string;
  wsUrl: string;
  configured: boolean;
};

type RuntimeConfig = {
  API_BASE_URL?: string;
  WS_URL?: string;
};

declare global {
  interface Window {
    __APP_CONFIG__?: RuntimeConfig;
  }
}

function readWindowConfig(): RuntimeConfig {
  if (typeof window === 'undefined' || !window.__APP_CONFIG__) {
    return {};
  }
  return window.__APP_CONFIG__;
}

function normalizeUrl(value: string): string {
  return value.trim().replace(/\/+$/, '');
}

function readRuntimeValue(runtimeKey: keyof RuntimeConfig, viteKey: 'VITE_API_URL' | 'VITE_WS_URL'): string {
  const windowConfig = readWindowConfig();
  const envValue = String(import.meta.env[viteKey] || '');
  return normalizeUrl(windowConfig[runtimeKey] || envValue);
}

export function getRuntimeMode(): RuntimeMode {
  const apiUrl = readRuntimeValue('API_BASE_URL', 'VITE_API_URL');
  const wsUrl = readRuntimeValue('WS_URL', 'VITE_WS_URL');

  return {
    apiUrl,
    wsUrl,
    configured: Boolean(apiUrl || wsUrl),
  };
}

export function getApiBaseUrl(): string {
  const apiUrl = getRuntimeMode().apiUrl;
  if (!apiUrl) {
    throw new Error('Missing runtime configuration: API_BASE_URL');
  }
  return apiUrl;
}

export function buildApiUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${getApiBaseUrl()}${normalizedPath}`;
}

export function getWebSocketUrl(): string {
  const wsUrl = getRuntimeMode().wsUrl;
  if (!wsUrl) {
    throw new Error('Missing runtime configuration: WS_URL');
  }
  return wsUrl;
}
