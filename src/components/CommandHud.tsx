import { getRuntimeMode } from '../services/runtime';
import type { DialogueScene } from '../data/runtimeScene';
import type { AuthUser, SimulationStatus } from '../services/types';
import type { RuntimeStatus } from '../state/vnEventReducer';

type Props = {
  backendConfigured: boolean;
  loading?: boolean;
  onLogout?: () => void;
  onOpenDocuments?: () => void;
  onRefresh?: () => Promise<void>;
  onRestart?: () => Promise<void> | void;
  onResumeCurrentCase?: () => Promise<void>;
  runtimeError?: string;
  runtimeStatus: RuntimeStatus;
  scene: DialogueScene;
  simulation?: SimulationStatus | null;
  user: AuthUser | null;
  wsConnected?: boolean;
};

export function CommandHud({
  backendConfigured,
  loading = false,
  onLogout,
  onOpenDocuments,
  onRefresh,
  onRestart,
  onResumeCurrentCase,
  runtimeError = '',
  runtimeStatus,
  scene,
  simulation,
  user,
  wsConnected = false,
}: Props) {
  const runtime = getRuntimeMode();
  const caseState = simulation ? getCaseStateLabel(simulation) : '未启动';
  const lastError = runtimeError || runtimeStatus.lastError || simulation?.lastError?.message || '';

  return (
    <header className="command-hud">
      <div>
        <div className="eyebrow">SimAilaw Town v2</div>
        <h1>法律全流程仿真</h1>
      </div>
      <div className="hud-runtime-grid" aria-label="运行状态">
        <StatusItem label="案件" value={scene.caseTitle || caseState} />
        <StatusItem label="阶段" value={`${scene.stageCode} ${scene.stageName}`} />
        <StatusItem label="当前角色" value={scene.playerSeat} />
        <StatusItem label="模式" value={backendConfigured ? '后端模式' : '本地预览'} />
        <StatusItem label="配置" value={runtime.configured ? '后端已配置' : '内置数据'} />
        <StatusItem label="实时" value={wsConnected ? '实时已连接' : '实时未连接'} tone={wsConnected ? 'ok' : 'warn'} />
        {simulation && <StatusItem label="运行" value={caseState} tone={simulation.paused ? 'warn' : undefined} />}
        <StatusItem label="当前状态" value={runtimeStatus.message || '等待案件运行'} wide />
        {runtimeStatus.detail && <StatusItem label="详情" value={runtimeStatus.detail} wide />}
        {lastError && <StatusItem label="最近错误" value={lastError} tone="error" wide />}
      </div>
      <div className="hud-actions" aria-label="操作">
        {user && <span className="pill">{user.email}</span>}
        {backendConfigured && user && (
          <>
            <button className="hud-button" disabled={loading} onClick={() => void onRefresh?.()} type="button">
              刷新
            </button>
            <button className="hud-button" disabled={loading} onClick={onOpenDocuments} type="button">
              文书
            </button>
            {simulation?.canStart && onResumeCurrentCase && simulation.status !== 'idle' && (
              <button className="hud-button" disabled={loading} onClick={() => void onResumeCurrentCase()} type="button">
                继续当前案件
              </button>
            )}
            <button className="hud-button" disabled={loading || !simulation?.canRestart} onClick={() => void onRestart?.()} type="button">
              重置
            </button>
          </>
        )}
        {onLogout && (
          <button className="hud-button" disabled={loading} onClick={onLogout} type="button">
            退出登录
          </button>
        )}
      </div>
    </header>
  );
}

type StatusItemProps = {
  label: string;
  value: string;
  tone?: 'ok' | 'warn' | 'error';
  wide?: boolean;
};

function StatusItem({ label, value, tone, wide = false }: StatusItemProps) {
  return (
    <div className={`hud-status-item ${tone || ''} ${wide ? 'wide' : ''}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function getCaseStateLabel(simulation: SimulationStatus): string {
  if (simulation.paused) return '已暂停';
  if (simulation.simulationRunning || simulation.status === 'running') return '案件运行中';
  if (simulation.status === 'idle') return '未启动';
  return simulation.status || '未启动';
}
