import { lifecycleStages } from '../data/demo';

export function LifecycleTimeline() {
  return (
    <nav className="timeline" aria-label="案件生命周期">
      {lifecycleStages.map((stage) => (
        <article className={`timeline-step ${stage.status}`} key={stage.code}>
          <span className="stage-code">{stage.code}</span>
          <div>
            <strong>{stage.title}</strong>
            <p>{stage.description}</p>
          </div>
        </article>
      ))}
    </nav>
  );
}
