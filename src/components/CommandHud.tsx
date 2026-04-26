import { getRuntimeMode } from '../services/runtime';
import type { DialogueScene } from '../data/runtimeScene';
import type { AuthUser, SimulationStatus } from '../services/types';

type Props = {
  backendConfigured: boolean;
  loading?: boolean;
  onLogout?: () => void;
  onOpenDocuments?: () => void;
  onRefresh?: () => Promise<void>;
  onRestart?: () => Promise<void> | void;
  onResumeCurrentCase?: () => Promise<void>;
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
  scene,
  simulation,
  user,
  wsConnected = false,
}: Props) {
  const runtime = getRuntimeMode();
  return (
    <header className="command-hud">
      <div>
        <div className="eyebrow">SimAilaw Town v2</div>
        <h1>法律全流程仿真</h1>
      </div>
      <div className="hud-pills" aria-label="系统状态">
        <span className="pill">{scene.caseTitle}</span>
        <span className="pill accent">{scene.stageCode} {scene.stageName}</span>
        <span className="pill accent">{scene.playerSeat}</span>
        <span className="pill live">{backendConfigured ? '后端模式' : '演示模式'}</span>
        <span className="pill">{runtime.configured ? '后端已配置' : '内置数据'}</span>
        {backendConfigured && <span className="pill">{wsConnected ? '实时已连接' : '实时未连接'}</span>}
        {simulation && <span className="pill">运行状态：{simulation.status}</span>}
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
