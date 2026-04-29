import { APP_VERSION_LABEL } from '../generated/buildInfo';

export function BuildVersionBadge() {
  return (
    <aside className="build-version-badge" aria-label="当前前端版本">
      {APP_VERSION_LABEL}
    </aside>
  );
}
