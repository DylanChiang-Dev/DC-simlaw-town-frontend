import { getRuntimeMode } from '../services/runtime';
import type { DialogueScene } from '../data/demo';
import type { AuthUser, SimulationStatus } from '../services/types';

type Props = {
  backendConfigured: boolean;
  loading?: boolean;
  onLogout?: () => void;
  onPause?: () => Promise<void>;
  onRefresh?: () => Promise<void>;
  onRestart?: () => Promise<void>;
  scene: DialogueScene;
  simulation?: SimulationStatus | null;
  user: AuthUser | null;
  wsConnected?: boolean;
};

export function CommandHud({
  backendConfigured,
  loading = false,
  onLogout,
  onPause,
  onRefresh,
  onRestart,
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
        <h1>法律互动视觉小说演示台</h1>
      </div>
      <div className="hud-pills" aria-label="系统状态">
        <span className="pill">{scene.caseTitle}</span>
        <span className="pill accent">{scene.stageCode} {scene.stageName}</span>
        <span className="pill accent">{scene.playerSeat}</span>
        <span className="pill live">{backendConfigured ? '后端模式' : '演示模式'}</span>
        <span className="pill">{runtime.configured ? '后端已配置' : '内置数据'}</span>
        {backendConfigured && <span className="pill">{wsConnected ? '实时已连接' : '实时未连接'}</span>}
        {simulation && <span className="pill">沙盒：{simulation.status}</span>}
        {user && <span className="pill">{user.email}</span>}
        {backendConfigured && user && (
          <>
            <button className="hud-button" disabled={loading} onClick={() => void onRefresh?.()} type="button">
              刷新
            </button>
            <button className="hud-button" disabled={loading || !simulation?.canPause} onClick={() => void onPause?.()} type="button">
              暂停
            </button>
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
