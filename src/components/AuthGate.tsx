import { ReactNode, useEffect, useMemo, useState } from 'react';
import { fetchCurrentUser } from '../services/apiClient';
import { AUTH_LOGOUT_EVENT, getAuthService } from '../services/auth';
import { getRuntimeMode } from '../services/runtime';
import { ensureSandbox } from '../services/sandboxApi';
import type { AuthUser } from '../services/types';
import { LoginPanel } from './LoginPanel';

export type AuthGateState = {
  backendConfigured: boolean;
  user: AuthUser | null;
  onLogout: () => void;
};

type Props = {
  children: (state: AuthGateState) => ReactNode;
};

type BootstrapState = 'checking' | 'authenticated' | 'unauthenticated' | 'offline';

export function AuthGate({ children }: Props) {
  const runtime = useMemo(() => getRuntimeMode(), []);
  const authService = useMemo(() => getAuthService(), []);
  const [state, setState] = useState<BootstrapState>(runtime.configured ? 'checking' : 'offline');
  const [user, setUser] = useState<AuthUser | null>(authService.getCurrentUser());
  const [error, setError] = useState('');

  async function bootstrapAuthenticatedSession(): Promise<void> {
    if (!runtime.configured) {
      setState('offline');
      return;
    }

    const restored = authService.restoreSession();
    if (!restored) {
      setUser(null);
      setState('unauthenticated');
      return;
    }

    try {
      await fetchCurrentUser();
      await ensureSandbox();
      setUser(authService.getCurrentUser());
      setError('');
      setState('authenticated');
    } catch (err) {
      authService.logout();
      setUser(null);
      setError(err instanceof Error ? err.message : '无法恢复登录状态');
      setState('unauthenticated');
    }
  }

  function handleLogout(): void {
    authService.logout();
    setUser(null);
    setState(runtime.configured ? 'unauthenticated' : 'offline');
  }

  useEffect(() => {
    void bootstrapAuthenticatedSession();
    const handleAuthLogout = () => {
      setUser(null);
      setState(runtime.configured ? 'unauthenticated' : 'offline');
    };
    window.addEventListener(AUTH_LOGOUT_EVENT, handleAuthLogout);
    return () => window.removeEventListener(AUTH_LOGOUT_EVENT, handleAuthLogout);
    // Runtime config is read once at app boot.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (state === 'offline' || state === 'authenticated') {
    return (
      <>
        {children({
          backendConfigured: runtime.configured,
          user,
          onLogout: handleLogout,
        })}
      </>
    );
  }

  if (state === 'checking') {
    return (
      <main className="auth-shell">
        <section className="auth-loading">
          <div className="panel-kicker">SimAilaw Town</div>
          <h1>正在恢复案件工作区</h1>
          <p>正在校验登录状态并连接案件工作区。</p>
        </section>
      </main>
    );
  }

  return (
    <>
      {error && <div className="auth-toast" role="alert">{error}</div>}
      <LoginPanel onAuthenticated={bootstrapAuthenticatedSession} />
    </>
  );
}
