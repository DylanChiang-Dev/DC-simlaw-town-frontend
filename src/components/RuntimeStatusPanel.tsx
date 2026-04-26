import type { DialogueScene } from '../data/runtimeScene';
import type { RuntimeStatus } from '../state/vnEventReducer';
import type { SimulationStatus } from '../services/types';

type Props = {
  backendConfigured: boolean;
  runtimeError?: string;
  runtimeStatus: RuntimeStatus;
  scene: DialogueScene;
  simulation?: SimulationStatus | null;
  wsConnected: boolean;
};

export function RuntimeStatusPanel({
  backendConfigured,
  runtimeError = '',
  runtimeStatus,
  scene,
  simulation,
  wsConnected,
}: Props) {
  const caseState = simulation ? getCaseStateLabel(simulation) : '未启动';
  const lastError = runtimeError || runtimeStatus.lastError || simulation?.lastError?.message || '';

  return (
    <aside className="runtime-status-panel" aria-label="运行状态">
      <div className="panel-kicker">Runtime</div>
      <h2>运行状态</h2>
      <div className="runtime-status-grid">
        <StatusItem label="模式" value={backendConfigured ? '后端模式' : '本地预览'} />
        <StatusItem label="实时" value={wsConnected ? '实时已连接' : '实时未连接'} tone={wsConnected ? 'ok' : 'warn'} />
        <StatusItem label="案件" value={caseState} />
        <StatusItem label="阶段" value={`${scene.stageCode} ${scene.stageName}`} />
        <StatusItem label="当前状态" value={runtimeStatus.message || '等待案件运行'} wide />
        {runtimeStatus.detail && <StatusItem label="详情" value={runtimeStatus.detail} wide />}
        {lastError && <StatusItem label="最近错误" value={lastError} tone="error" wide />}
      </div>
    </aside>
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
    <div className={`runtime-status-item ${tone || ''} ${wide ? 'wide' : ''}`}>
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
