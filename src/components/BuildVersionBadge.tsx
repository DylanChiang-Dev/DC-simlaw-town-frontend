import { useEffect, useState } from 'react';
import { APP_VERSION_LABEL } from '../generated/buildInfo';
import { buildApiUrl } from '../services/runtime';

export function BuildVersionBadge() {
  const [backendVersionLabel, setBackendVersionLabel] = useState('');

  useEffect(() => {
    const controller = new AbortController();

    async function fetchBackendVersion() {
      try {
        const response = await fetch(buildApiUrl('/api/status'), { signal: controller.signal });
        if (!response.ok) return;
        const payload = await response.json() as { backend_version_label?: string };
        setBackendVersionLabel(String(payload.backend_version_label || '').trim());
      } catch (error) {
        if ((error as Error)?.name !== 'AbortError') {
          setBackendVersionLabel('');
        }
      }
    }

    fetchBackendVersion();
    return () => controller.abort();
  }, []);

  return (
    <aside className="build-version-badge" aria-label="当前系统版本">
      <span className="build-version-line">前端 {APP_VERSION_LABEL}</span>
      <span className="build-version-line">后端 {backendVersionLabel || '后端版本不可用'}</span>
    </aside>
  );
}
