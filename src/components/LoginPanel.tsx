import { FormEvent, useState } from 'react';
import {
  PROJECT_CONTACT_EMAIL,
  PROJECT_INFO_COPY,
  PROJECT_INFO_TITLE,
  PROJECT_SURVEY_LABEL,
} from '../config/projectInfo';
import { login } from '../services/apiClient';
import { getSimulationSurveyUrl } from '../services/runtime';

type Props = {
  onAuthenticated: () => Promise<void>;
};

export function LoginPanel({ onAuthenticated }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showForgotPasswordNotice, setShowForgotPasswordNotice] = useState(false);

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

  function handleOpenSurvey(): void {
    const surveyUrl = getSimulationSurveyUrl();
    if (!surveyUrl) {
      return;
    }
    globalThis.open?.(surveyUrl, '_blank', 'noopener,noreferrer');
  }

  return (
    <main className="auth-shell">
      <section className="auth-stage" aria-label="登录 SimAilaw Town">
        <img className="auth-background" src="/art/vn/bg-law-office.png" alt="律所咨询室" />
        <div className="auth-vignette" />
        <form className="login-panel" onSubmit={handleSubmit}>
          <div className="panel-kicker">SimAilaw Town</div>
          <h1>进入法律全流程仿真</h1>
          <p>登录后进入案件工作区。你将以当前案件角色参与咨询、文书起草、庭审与上诉，案件进度、用户任务、智能助手协作和文书结果会实时同步。</p>
          <section className="login-project-card" aria-label={PROJECT_INFO_TITLE}>
            <div className="login-project-title">{PROJECT_INFO_TITLE}</div>
            <p>{PROJECT_INFO_COPY}</p>
            <div className="login-project-actions">
              <button className="login-project-button" onClick={handleOpenSurvey} type="button">
                {PROJECT_SURVEY_LABEL}
              </button>
              <a href={`mailto:${PROJECT_CONTACT_EMAIL}`}>联系邮箱：{PROJECT_CONTACT_EMAIL}</a>
            </div>
          </section>
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
          <button
            className="login-secondary-link"
            onClick={() => setShowForgotPasswordNotice((visible) => !visible)}
            type="button"
          >
            忘记密码？
          </button>
          {showForgotPasswordNotice && (
            <div className="login-forgot-notice" role="status">
              <span>请跟开发者联系</span>
              <b>{PROJECT_CONTACT_EMAIL}</b>
            </div>
          )}
          {error && <div className="auth-error" role="alert">{error}</div>}
          <button className="primary-action wide" disabled={submitting} type="submit">
            {submitting ? '登录中' : '登录并进入案件'}
          </button>
        </form>
      </section>
    </main>
  );
}
