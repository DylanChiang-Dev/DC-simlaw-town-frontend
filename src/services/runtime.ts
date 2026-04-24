export type RuntimeMode = {
  apiUrl: string;
  wsUrl: string;
  configured: boolean;
};

export function getRuntimeMode(): RuntimeMode {
  const apiUrl = String(import.meta.env.VITE_API_URL || '').trim();
  const wsUrl = String(import.meta.env.VITE_WS_URL || '').trim();

  return {
    apiUrl,
    wsUrl,
    configured: Boolean(apiUrl || wsUrl),
  };
}
