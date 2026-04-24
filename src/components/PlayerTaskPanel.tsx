import { playerTask } from '../data/demo';

type Props = {
  onOpenDocument: () => void;
};

export function PlayerTaskPanel({ onOpenDocument }: Props) {
  return (
    <aside className="player-task panel">
      <div className="panel-kicker">玩家律师任务</div>
      <h2>{playerTask.title}</h2>
      <div className="task-stage">{playerTask.stage}</div>
      <p>{playerTask.body}</p>
      <div className="task-actions">
        {playerTask.actions.map((item, index) => (
          <button
            className={index === 1 ? 'primary-action' : 'secondary-action'}
            key={item}
            type="button"
            onClick={index === 1 ? onOpenDocument : undefined}
          >
            {item}
          </button>
        ))}
      </div>
    </aside>
  );
}
