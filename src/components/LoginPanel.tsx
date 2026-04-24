import { FormEvent, useState } from 'react';
import { login } from '../services/apiClient';

type Props = {
  onAuthenticated: () => Promise<void>;
};

export function LoginPanel({ onAuthenticated }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await login(email.trim(), password);
      await onAuthenticated();
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-stage" aria-label="登录 SimAilaw Town">
        <img className="auth-background" src="/art/vn/bg-law-office.png" alt="律所咨询室" />
        <div className="auth-vignette" />
        <form className="login-panel" onSubmit={handleSubmit}>
          <div className="panel-kicker">SimAilaw Town</div>
          <h1>进入法律互动视觉小说</h1>
          <p>登录后会进入你的专属沙盒，当前案件、玩家律师任务、Agent 调用和文书结果都会从后端同步。</p>
          <label>
            <span>邮箱</span>
            <input
              autoComplete="email"
              disabled={submitting}
              onChange={(event) => setEmail(event.target.value)}
              required
              type="email"
              value={email}
            />
          </label>
          <label>
            <span>密码</span>
            <input
              autoComplete="current-password"
              disabled={submitting}
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
          </label>
          {error && <div className="auth-error" role="alert">{error}</div>}
          <button className="primary-action wide" disabled={submitting} type="submit">
            {submitting ? '登录中' : '登录并进入沙盒'}
          </button>
        </form>
      </section>
    </main>
  );
}
