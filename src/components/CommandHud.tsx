import { getRuntimeMode } from '../services/runtime';

export function CommandHud() {
  const runtime = getRuntimeMode();
  return (
    <header className="command-hud">
      <div>
        <div className="eyebrow">SimAilaw Town v2 Demo</div>
        <h1>全生命周期法律仿真演示台</h1>
      </div>
      <div className="hud-pills" aria-label="系统状态">
        <span className="pill live">演示模式</span>
        <span className="pill">{runtime.configured ? '后端已配置' : '内置数据'}</span>
        <span className="pill accent">玩家律师模式</span>
      </div>
    </header>
  );
}
