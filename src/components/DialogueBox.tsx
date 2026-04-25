import { characters, type DialogueScene } from '../data/demo';
import { MarkdownText } from './MarkdownText';
import type { PlayerLawyerRequest } from '../services/types';
import type { DialogueHistoryEntry } from '../state/vnEventReducer';

type Props = {
  backendMode?: boolean;
  dialogueGate?: {
    gateId: string;
    pending?: boolean;
    speakerName: string;
    turn: number;
  } | null;
  history?: DialogueHistoryEntry[];
  onContinueDialogue?: () => void;
  onOpenPlayerInput?: () => void;
  scene: DialogueScene;
  onAction: (action: string) => void;
  pendingRequest?: PlayerLawyerRequest | null;
  wsConnected?: boolean;
};

export function DialogueBox({
  backendMode = false,
  dialogueGate = null,
  history = [],
  onAction,
  onContinueDialogue,
  onOpenPlayerInput,
  pendingRequest,
  scene,
  wsConnected = true,
}: Props) {
  const speaker = characters[scene.speaker];
  const transcript = backendMode ? history : [];
  const showTranscript = backendMode && transcript.length > 0;
  const showActions = !backendMode || Boolean(pendingRequest || dialogueGate);

  return (
    <section className="dialogue-box" aria-label="角色对话">
      <div className="speaker-plate">
        <strong>{speaker.name}</strong>
        <span>{speaker.role}</span>
      </div>
      <div className="player-seat-chip">{scene.playerSeat}</div>
      {showTranscript ? (
        <div className="dialogue-history" aria-label="案件对话记录">
          {transcript.map((entry, index) => (
            <article
              className={`dialogue-history-entry ${entry.kind} ${index === transcript.length - 1 ? 'current' : ''}`}
              key={entry.id}
            >
              <span>{entry.speakerName}</span>
              <MarkdownText text={entry.text} />
            </article>
          ))}
        </div>
      ) : (
        <MarkdownText className="dialogue-current-text" text={scene.text} />
      )}
      {backendMode && pendingRequest && (
        <div className="player-turn-preview" aria-label="玩家律师回合要求">
          <strong>轮到玩家律师输入</strong>
          <MarkdownText text={pendingRequest.contextSummary} />
          <MarkdownText
            fallback="请根据当前案件进展输入玩家律师回复。"
            text={pendingRequest.prompt || pendingRequest.message}
          />
        </div>
      )}
      {showActions && <div className="dialogue-actions">
        {backendMode ? (
          pendingRequest ? (
            <button type="button" onClick={onOpenPlayerInput}>
              输入律师回复
            </button>
          ) : dialogueGate ? (
            <button disabled={dialogueGate.pending || !wsConnected} type="button" onClick={onContinueDialogue}>
              {!wsConnected ? '实时未连接，正在重连' : dialogueGate.pending ? '等待后端响应' : '继续下一句'}
            </button>
          ) : null
        ) : (
          scene.actions.map((action) => (
            <button key={action} type="button" onClick={() => onAction(action)}>
              {action}
            </button>
          ))
        )}
      </div>}
    </section>
  );
}
