import { useState } from 'react';
import { characters, type DialogueScene } from '../data/runtimeScene';
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
  pendingRequest?: PlayerLawyerRequest | null;
  wsConnected?: boolean;
};

export function DialogueBox({
  backendMode = false,
  dialogueGate = null,
  history = [],
  onContinueDialogue,
  onOpenPlayerInput,
  pendingRequest,
  scene,
  wsConnected = true,
}: Props) {
  const [recordsOpen, setRecordsOpen] = useState(false);
  const speaker = characters[scene.speaker];
  const transcript = backendMode ? history : [];
  const currentEntry = transcript[transcript.length - 1] || null;
  const showTranscript = backendMode && Boolean(currentEntry);
  const canOpenTranscript = backendMode && transcript.length > 1;
  const showActions = Boolean(pendingRequest || dialogueGate || canOpenTranscript);

  return (
    <section className="dialogue-box" aria-label="角色对话">
      <div className="speaker-plate">
        <strong>{speaker.name}</strong>
        <span>{speaker.role}</span>
      </div>
      <div className="player-seat-chip">{scene.playerSeat}</div>
      {showTranscript ? (
        <article className={`dialogue-current-entry ${currentEntry?.kind || 'dialogue'}`} aria-label="当前对话">
          <span>{currentEntry?.speakerName}</span>
          <MarkdownText text={currentEntry?.text || ''} />
        </article>
      ) : (
        <MarkdownText className="dialogue-current-text" text={scene.text} />
      )}
      {backendMode && pendingRequest && (
        <div className="player-turn-preview" aria-label="当前用户任务要求">
          <strong>轮到用户处理当前角色任务</strong>
          <MarkdownText text={pendingRequest.contextSummary} />
          <MarkdownText
            fallback="请根据当前案件进展输入当前角色回复。"
            text={pendingRequest.prompt || pendingRequest.message}
          />
        </div>
      )}
      {showActions && <div className="dialogue-actions">
        {backendMode ? (
          <>
            {canOpenTranscript && (
              <button className="secondary-action" type="button" onClick={() => setRecordsOpen(true)}>
                查看全部记录
              </button>
            )}
            {pendingRequest ? (
              <button type="button" onClick={onOpenPlayerInput}>
                {isDocumentStage(pendingRequest.stage) ? '处理文书任务' : '输入当前角色回复'}
              </button>
            ) : dialogueGate ? (
              <button disabled={dialogueGate.pending || !wsConnected} type="button" onClick={onContinueDialogue}>
                {!wsConnected ? '实时未连接，正在重连' : dialogueGate.pending ? '等待后端响应' : '继续查看下一句'}
              </button>
            ) : null}
          </>
        ) : null}
      </div>}
      {recordsOpen && (
        <div className="modal-layer" role="dialog" aria-modal="true" aria-label="全部对话记录">
          <section className="dialogue-records-dialog">
            <div className="panel-kicker">Case Transcript</div>
            <h2>全部对话记录</h2>
            <div className="dialogue-records-list">
              {transcript.map((entry) => (
                <article className={`dialogue-history-entry ${entry.kind}`} key={entry.id}>
                  <span>{entry.speakerName}</span>
                  <MarkdownText text={entry.text} />
                </article>
              ))}
            </div>
            <div className="dialogue-records-actions">
              <button className="secondary-action" type="button" onClick={() => setRecordsOpen(false)}>
                关闭
              </button>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}

function isDocumentStage(stage?: string): boolean {
  return ['CD', 'AD', 'AR'].includes(String(stage || '').toUpperCase());
}
