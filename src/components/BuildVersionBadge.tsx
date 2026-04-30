import { useEffect, useState } from 'react';
import { APP_VERSION, APP_VERSION_TIME } from '../generated/buildInfo';
import { buildApiUrl } from '../services/runtime';

type BackendVersion = {
  version: string;
  versionTime: string;
};

export function BuildVersionBadge() {
  const [backendVersion, setBackendVersion] = useState<BackendVersion | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchBackendVersion() {
      try {
        const response = await fetch(buildApiUrl('/api/status'), { signal: controller.signal });
        if (!response.ok) return;
        const payload = await response.json() as { backend_version?: string; backend_version_time?: string };
        const version = String(payload.backend_version || '').trim();
        const versionTime = String(payload.backend_version_time || '').trim();
        setBackendVersion(version ? { version, versionTime } : null);
      } catch (error) {
        if ((error as Error)?.name !== 'AbortError') {
          setBackendVersion(null);
        }
      }
    }

    fetchBackendVersion();
    return () => controller.abort();
  }, []);

  return (
    <aside className="build-version-badge" aria-label="当前系统版本">
      <span className="build-version-line">
        <span className="build-version-label">前端</span>
        <span className="build-version-number">v{APP_VERSION}</span>
        <span className="build-version-time">· {APP_VERSION_TIME}</span>
      </span>
      <span className="build-version-line">
        <span className="build-version-label">后端</span>
        <span className="build-version-number">{backendVersion ? `v${backendVersion.version}` : '版本不可用'}</span>
        <span className="build-version-time">{backendVersion?.versionTime ? `· ${backendVersion.versionTime}` : ''}</span>
      </span>
    </aside>
  );
}
