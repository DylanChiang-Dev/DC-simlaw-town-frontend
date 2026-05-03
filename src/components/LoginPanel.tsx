import { FormEvent, useState } from 'react';
import {
  PROJECT_CONTACT_EMAIL,
  PROJECT_INFO_COPY,
  PROJECT_INFO_TITLE,
  PROJECT_SURVEY_LABEL,
} from '../config/projectInfo';
import { login, register } from '../services/apiClient';
import { getSimulationSurveyUrl } from '../services/runtime';

type Props = {
  onAuthenticated: () => Promise<void>;
};

type AuthMode = 'login' | 'register';

const LOGIN_CASE_MEMORY_IMAGES = [
  '/art/vn/cg-case1-hair-salon-rent-evidence.png',
  '/art/vn/cg-case3-swimming-pool-loan-evidence.png',
  '/art/vn/cg-case5-car-purchase-evidence.png',
  '/art/vn/cg-case6-fabric-iou-evidence.png',
  '/art/vn/cg-case7-shanghai-traffic-accident-overview.png',
  '/art/vn/cg-case9-traffic-accident-overview.png',
];

export function LoginPanel({ onAuthenticated }: Props) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showForgotPasswordNotice, setShowForgotPasswordNotice] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (mode === 'register' && password !== confirmPassword) {
      setError('请再次输入相同的密码');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      if (mode === 'register') {
        await register(email.trim(), password);
      } else {
        await login(email.trim(), password);
      }
      await onAuthenticated();
    } catch (err) {
      setError(err instanceof Error ? err.message : mode === 'register' ? '注册失败' : '登录失败');
    } finally {
      setSubmitting(false);
    }
  }

  function switchMode(nextMode: AuthMode): void {
    setMode(nextMode);
    setError('');
    setConfirmPassword('');
    setShowForgotPasswordNotice(false);
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
        <div className="auth-cg-scene">
          <img className="auth-background" src="/art/vn/bg-login-law-office-v3.png" alt="法律全流程仿真工作台" />
          <div aria-hidden="true" className="auth-cg-light-sweep" />
          <div aria-hidden="true" className="auth-cg-case-lines" />
          <div aria-hidden="true" className="auth-cg-dust" />
          <div aria-hidden="true" className="auth-cg-screen-glow" />
          <img
            aria-hidden="true"
            className="auth-art-layer"
            src="/art/vn/login-layer-legal-evidence-v2.png"
            alt=""
          />
          <div aria-hidden="true" className="auth-case-memory-wall">
            {LOGIN_CASE_MEMORY_IMAGES.map((imageSrc, index) => (
              <img
                alt=""
                className={`auth-case-polaroid case-memory-${index + 1}`}
                key={imageSrc}
                src={imageSrc}
              />
            ))}
          </div>
        </div>
        <div className="auth-vignette" />
        <form className="login-panel" onSubmit={handleSubmit}>
          <div className="panel-kicker">SimAilaw Town</div>
          <h1>进入法律全流程仿真</h1>
          <p>登录后进入案件工作区。你将以当前案件角色参与咨询、文书起草、庭审与上诉，案件进度、用户任务、智能助手协作和文书结果会实时同步。</p>
          <div className="login-mode-switch" aria-label="登录或注册">
            <button className={mode === 'login' ? 'active' : ''} onClick={() => switchMode('login')} type="button">
              登录
            </button>
            <button className={mode === 'register' ? 'active' : ''} onClick={() => switchMode('register')} type="button">
              注册
            </button>
          </div>
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
          {mode === 'register' && (
            <label>
              <span>确认密码</span>
              <input
                autoComplete="new-password"
                disabled={submitting}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
                type="password"
                value={confirmPassword}
              />
            </label>
          )}
          {mode === 'login' && (
            <button
              className="login-secondary-link"
              onClick={() => setShowForgotPasswordNotice((visible) => !visible)}
              type="button"
            >
              忘记密码？
            </button>
          )}
          {showForgotPasswordNotice && (
            <div className="login-forgot-notice" role="status">
              <span>请跟开发者联系</span>
              <b>{PROJECT_CONTACT_EMAIL}</b>
            </div>
          )}
          {error && <div className="auth-error" role="alert">{error}</div>}
          <button className="primary-action wide" disabled={submitting} type="submit">
            {submitting ? (mode === 'register' ? '注册中' : '登录中') : mode === 'register' ? '注册并进入案件' : '登录并进入案件'}
          </button>
        </form>
      </section>
    </main>
  );
}
