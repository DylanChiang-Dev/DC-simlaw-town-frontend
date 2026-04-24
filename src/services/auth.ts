import type { AuthResponseUser, AuthSession, AuthUser } from './types';

export const AUTH_LOGOUT_EVENT = 'simlaw-v2:auth-logout';

const STORAGE_KEYS = {
  ACCESS_TOKEN: 'simlaw_auth_access_token',
  AUTH_USER: 'simlaw_auth_user',
  EXPIRES_AT: 'simlaw_auth_expires_at',
};

const LEGACY_SESSION_EXPIRES_AT = new Date(0).toISOString();

function mapUser(payload: AuthResponseUser, fallback?: AuthUser | null): AuthUser | null {
  const id = String(payload.id || fallback?.id || '').trim();
  const email = String(payload.email || fallback?.email || '').trim();
  if (!id || !email) {
    return null;
  }
  return {
    id,
    email,
    status: String(payload.status || fallback?.status || '').trim(),
    tokenVersion: Number(payload.tokenVersion ?? payload.token_version ?? fallback?.tokenVersion ?? 0),
  };
}

export class AuthService {
  private static instance: AuthService;
  private session: AuthSession | null = null;

  private constructor() {
    this.session = this.readSessionFromStorage();
  }

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  saveSession(session: AuthSession): void {
    const expiresAt = session.expiresAt || LEGACY_SESSION_EXPIRES_AT;
    this.session = { ...session, expiresAt };
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, session.accessToken);
    localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(session.user));
    localStorage.setItem(STORAGE_KEYS.EXPIRES_AT, expiresAt);
  }

  saveTokenResponse(payload: { access_token?: string; expires_at?: string; user?: AuthResponseUser }): AuthSession | null {
    const accessToken = String(payload.access_token || '').trim();
    const user = payload.user ? mapUser(payload.user, this.session?.user) : this.session?.user || null;
    if (!accessToken || !user) {
      return null;
    }
    const session = {
      accessToken,
      user,
      expiresAt: payload.expires_at || LEGACY_SESSION_EXPIRES_AT,
    };
    this.saveSession(session);
    return session;
  }

  restoreSession(): AuthSession | null {
    this.session = this.readSessionFromStorage();
    return this.session;
  }

  logout(): void {
    this.session = null;
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
    localStorage.removeItem(STORAGE_KEYS.EXPIRES_AT);
    window.dispatchEvent(new Event(AUTH_LOGOUT_EVENT));
  }

  getAccessToken(): string {
    return this.session?.accessToken || '';
  }

  getCurrentUser(): AuthUser | null {
    return this.session?.user || null;
  }

  getExpiresAt(): string {
    return this.session?.expiresAt || '';
  }

  willExpireWithin(windowMs: number): boolean {
    const expiresAt = Date.parse(this.getExpiresAt());
    if (!Number.isFinite(expiresAt)) {
      return true;
    }
    return expiresAt - Date.now() <= windowMs;
  }

  isAuthenticated(): boolean {
    return Boolean(this.session?.accessToken && this.session.user);
  }

  private readSessionFromStorage(): AuthSession | null {
    const accessToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    const rawUser = localStorage.getItem(STORAGE_KEYS.AUTH_USER);
    const rawExpiresAt = localStorage.getItem(STORAGE_KEYS.EXPIRES_AT);
    if (!accessToken || !rawUser) {
      return null;
    }

    try {
      const user = mapUser(JSON.parse(rawUser) as AuthResponseUser);
      if (!user) {
        return null;
      }

      const expiresAt = rawExpiresAt || LEGACY_SESSION_EXPIRES_AT;
      const expiresAtMs = Date.parse(expiresAt);
      if (rawExpiresAt && (!Number.isFinite(expiresAtMs) || expiresAtMs <= Date.now())) {
        localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
        localStorage.removeItem(STORAGE_KEYS.EXPIRES_AT);
        return null;
      }

      return { accessToken, user, expiresAt };
    } catch {
      return null;
    }
  }
}

export function getAuthService(): AuthService {
  return AuthService.getInstance();
}
