import { getRuntimeMode } from '../services/runtime';
import type { AuthUser, SimulationStatus } from '../services/types';
import type { RuntimeStatus } from '../state/vnEventReducer';

type Props = {
  autoNextEnabled?: boolean;
  backendConfigured: boolean;
  canOpenClosingSummary?: boolean;
  loading?: boolean;
  onAutoNextChange?: (enabled: boolean) => void;
  onLogout?: () => void;
  onOpenClosingSummary?: () => void;
  onOpenDocuments?: () => void;
  onOpenOnboardingGuide?: () => void;
  onRestart?: () => Promise<void> | void;
  onResumeCurrentCase?: () => Promise<void>;
  runtimeError?: string;
  runtimeStatus: RuntimeStatus;
  simulation?: SimulationStatus | null;
  user: AuthUser | null;
  wsConnected?: boolean;
};

export function CommandHud({
  autoNextEnabled = false,
  backendConfigured,
  canOpenClosingSummary = false,
  loading = false,
  onAutoNextChange,
  onLogout,
  onOpenClosingSummary,
  onOpenDocuments,
  onOpenOnboardingGuide,
  onRestart,
  onResumeCurrentCase,
  runtimeError = '',
  runtimeStatus,
  simulation,
  user,
  wsConnected = false,
}: Props) {
  const runtime = getRuntimeMode();
  const caseState = simulation ? getCaseStateLabel(simulation) : '未启动';
  const lastError = runtimeError || runtimeStatus.lastError || simulation?.lastError?.message || '';
  const connectionLabel = backendConfigured ? (wsConnected ? '实时已连接' : '实时未连接') : '本地预览';
  const canResume = Boolean(simulation?.canStart && onResumeCurrentCase && simulation.status !== 'idle');

  return (
    <header className="command-hud">
      <div className="hud-brand">
        <div className="eyebrow">Legal World v2</div>
        <h1>法律全流程仿真</h1>
      </div>
      <div className="hud-status-strip" aria-label="运行状态">
        <StatusPill label={backendConfigured ? '正式案件模式' : '本地预览'} />
        <StatusPill label={runtime.configured ? '案件服务已连接' : '内置数据'} />
        <StatusPill label={connectionLabel} tone={backendConfigured ? (wsConnected ? 'ok' : 'warn') : 'neutral'} />
        <StatusPill label={caseState} tone={simulation?.paused ? 'warn' : undefined} />
        {lastError && <StatusPill label="运行错误" tone="error" />}
      </div>
      <div className="hud-actions" aria-label="操作">
        <button
          role="switch"
          aria-checked={autoNextEnabled}
          className={`hud-button hud-switch ${autoNextEnabled ? 'active' : ''}`}
          onClick={() => onAutoNextChange?.(!autoNextEnabled)}
          type="button"
        >
          <span className="hud-switch-track" aria-hidden="true">
            <span className="hud-switch-thumb" />
          </span>
          自动下一句
        </button>
        {backendConfigured && user && (
          <>
            {onOpenOnboardingGuide && (
              <button className="hud-button" disabled={loading} onClick={onOpenOnboardingGuide} type="button">
                新手导航
              </button>
            )}
            <button className="hud-button" disabled={loading} onClick={onOpenDocuments} type="button">
              文书
            </button>
            {canOpenClosingSummary && onOpenClosingSummary && (
              <button className="hud-button" disabled={loading} onClick={onOpenClosingSummary} type="button">
                查看评分
              </button>
            )}
            {canResume && (
              <button className="hud-button" disabled={loading} onClick={() => void onResumeCurrentCase?.()} type="button">
                继续当前案件
              </button>
            )}
            <button className="hud-button" disabled={loading || !simulation?.canRestart} onClick={() => void onRestart?.()} type="button">
              重置
            </button>
          </>
        )}
        {onLogout && (
          <button className="hud-button account-action" disabled={loading} onClick={onLogout} title={user?.email || ''} type="button">
            退出登录
          </button>
        )}
      </div>
    </header>
  );
}

type StatusPillProps = {
  label: string;
  tone?: 'neutral' | 'ok' | 'warn' | 'error';
};

function StatusPill({ label, tone = 'neutral' }: StatusPillProps) {
  return <span className={`hud-status-pill ${tone}`}>{label}</span>;
}

function getCaseStateLabel(simulation: SimulationStatus): string {
  if (simulation.paused) return '已暂停';
  if (simulation.simulationRunning || simulation.status === 'running') return '案件运行中';
  if (simulation.status === 'idle') return '未启动';
  return simulation.status || '未启动';
}
