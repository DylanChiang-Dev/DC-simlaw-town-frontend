import { lifecycleStages } from '../data/runtimeScene';

type Props = {
  activeCode: string;
};

export function CaseTimeline({ activeCode }: Props) {
  const activeIndex = lifecycleStages.findIndex((stage) => stage.code === activeCode);

  return (
    <nav className="case-timeline" aria-label="案件生命周期">
      {lifecycleStages.map((stage, index) => {
        const status = stage.code === activeCode
          ? 'active'
          : index < activeIndex
            ? 'done'
            : 'upcoming';
        return (
          <div className={`case-stage ${status}`} key={stage.code}>
            <strong>{stage.code}</strong>
            <span>{stage.title}</span>
          </div>
        );
      })}
    </nav>
  );
}
