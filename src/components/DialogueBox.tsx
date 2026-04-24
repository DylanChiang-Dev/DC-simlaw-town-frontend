import { characters, type DialogueScene } from '../data/demo';

type Props = {
  scene: DialogueScene;
  onAction: (action: string) => void;
};

export function DialogueBox({ scene, onAction }: Props) {
  const speaker = characters[scene.speaker];

  return (
    <section className="dialogue-box" aria-label="角色对话">
      <div className="speaker-plate">
        <strong>{speaker.name}</strong>
        <span>{speaker.role}</span>
      </div>
      <div className="player-seat-chip">{scene.playerSeat}</div>
      <p>{scene.text}</p>
      <div className="dialogue-actions">
        {scene.actions.map((action) => (
          <button key={action} type="button" onClick={() => onAction(action)}>
            {action}
          </button>
        ))}
      </div>
    </section>
  );
}
