import { metrics } from '../data/demo';

export function HeroStage() {
  return (
    <section className="hero-stage" aria-label="法律小镇演示场景">
      <img className="hero-art" src="/art/legal-town-hero.png" alt="法律仿真小镇主视觉" />
      <div className="route route-a" />
      <div className="route route-b" />
      <div className="stage-marker court">法院</div>
      <div className="stage-marker firm-a">正义律所</div>
      <div className="stage-marker firm-b">和平律所</div>
      <div className="stage-console">
        <div className="console-title">实时 Pipeline</div>
        <div className="console-copy">Agent 行动、玩家输入、文书生成和庭审推进在同一张场景图里展示。</div>
        <div className="metric-grid">
          {metrics.map((item) => (
            <div className="metric" key={item.label}>
              <strong>{item.value}</strong>
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
