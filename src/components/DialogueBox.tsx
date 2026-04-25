import { characters, type DialogueScene } from '../data/demo';
import type { PlayerLawyerRequest } from '../services/types';
import type { DialogueHistoryEntry } from '../state/vnEventReducer';

type Props = {
  backendMode?: boolean;
  history?: DialogueHistoryEntry[];
  onOpenPlayerInput?: () => void;
  scene: DialogueScene;
  onAction: (action: string) => void;
  pendingRequest?: PlayerLawyerRequest | null;
};

export function DialogueBox({
  backendMode = false,
  history = [],
  onAction,
  onOpenPlayerInput,
  pendingRequest,
  scene,
}: Props) {
  const speaker = characters[scene.speaker];
  const recentHistory = history.slice(-6);

  return (
    <section className="dialogue-box" aria-label="角色对话">
      <div className="speaker-plate">
        <strong>{speaker.name}</strong>
        <span>{speaker.role}</span>
      </div>
      <div className="player-seat-chip">{scene.playerSeat}</div>
      {backendMode && recentHistory.length > 1 && (
        <div className="dialogue-history" aria-label="案件对话记录">
          {recentHistory.slice(0, -1).map((entry) => (
            <article className={`dialogue-history-entry ${entry.kind}`} key={entry.id}>
              <span>{entry.speakerName}</span>
              <p>{entry.text}</p>
            </article>
          ))}
        </div>
      )}
      <p>{scene.text}</p>
      {backendMode && pendingRequest && (
        <div className="player-turn-preview" aria-label="玩家律师回合要求">
          <strong>轮到玩家律师输入</strong>
          {pendingRequest.contextSummary && <p>{pendingRequest.contextSummary}</p>}
          <p>{pendingRequest.prompt || pendingRequest.message || '请根据当前案件进展输入玩家律师回复。'}</p>
        </div>
      )}
      <div className="dialogue-actions">
        {backendMode ? (
          pendingRequest ? (
            <button type="button" onClick={onOpenPlayerInput}>
              输入律师回复
            </button>
          ) : (
            <button className="secondary-action" disabled type="button">
              等待后端下一轮对话
            </button>
          )
        ) : (
          scene.actions.map((action) => (
            <button key={action} type="button" onClick={() => onAction(action)}>
              {action}
            </button>
          ))
        )}
      </div>
    </section>
  );
}
