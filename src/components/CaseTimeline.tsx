import { useState } from 'react';
import { MarkdownText } from './MarkdownText';
import type { DialogueHistoryEntry } from '../state/vnEventReducer';

type Props = {
  activeCode: string;
  backendMode?: boolean;
  history?: DialogueHistoryEntry[];
};

type TranscriptStageCode = 'PLC' | 'CD' | 'DLC' | 'DD' | 'CI' | 'AD' | 'AR' | 'CIA';
type TranscriptStage = { code: TranscriptStageCode; label: string; order: number };

const TRANSCRIPT_STAGES: TranscriptStage[] = [
  { order: 1, code: 'PLC', label: '原告咨询' },
  { order: 2, code: 'CD', label: '起诉状起草' },
  { order: 3, code: 'DLC', label: '被告咨询' },
  { order: 4, code: 'DD', label: '答辩状起草' },
  { order: 5, code: 'CI', label: '一审庭审' },
  { order: 6, code: 'AD', label: '上诉状起草' },
  { order: 7, code: 'AR', label: '上诉答辩状起草' },
  { order: 8, code: 'CIA', label: '二审庭审' },
];

const AUXILIARY_TRANSCRIPT_STAGES: Record<string, TranscriptStageCode> = {
  LC: 'PLC',
  RECEPTION: 'PLC',
  TIA: 'CI',
  TIAA: 'CIA',
  FINAL_VERDICT: 'CIA',
};

const DIRECT_TRANSCRIPT_STAGE_CODES = new Set<string>(TRANSCRIPT_STAGES.map((stage) => stage.code));

export function CaseTimeline({ activeCode, backendMode = false, history = [] }: Props) {
  const [activeTranscriptStage, setActiveTranscriptStage] = useState<TranscriptStageCode | null>(null);
  const transcriptGroups = groupTranscriptByStage(backendMode ? history : []);
  const activeLifecycleCode = getTranscriptStageCode(activeCode) || activeCode;
  const activeIndex = TRANSCRIPT_STAGES.findIndex((stage) => stage.code === activeLifecycleCode);
  const activeStage = TRANSCRIPT_STAGES.find((stage) => stage.code === activeTranscriptStage) || null;
  const activeStageEntries = activeStage ? transcriptGroups[activeStage.code] : [];
  const activeStageItems = activeStage ? annotateTranscriptEntries(activeStageEntries, activeStage) : [];

  return (
    <>
      <nav className="case-timeline" aria-label="案件生命周期">
        {TRANSCRIPT_STAGES.map((stage, index) => {
          const entries = transcriptGroups[stage.code];
          const status = stage.code === activeLifecycleCode
          ? 'active'
          : index < activeIndex
            ? 'done'
            : 'upcoming';
          return (
            <button
              className={`case-stage ${status}`}
              disabled={entries.length === 0}
              key={stage.code}
              onClick={() => setActiveTranscriptStage(stage.code)}
              type="button"
            >
              <small className="case-stage-order">{formatStageOrder(stage.order)}</small>
              <strong>{stage.code}</strong>
              <span>{stage.label}</span>
              {backendMode && <b className="case-stage-count">{entries.length}</b>}
            </button>
          );
        })}
      </nav>
      {activeStage && (
        <div className="modal-layer" role="dialog" aria-modal="true" aria-label={`${activeStage.label}对话记录`}>
          <section className="dialogue-records-dialog">
            <div className="panel-kicker">{activeStage.code} Case Transcript</div>
            <h2>{activeStage.label}对话记录</h2>
            <div className="dialogue-records-list">
              {activeStageItems.map((item) => (
                <article className={`dialogue-history-entry ${item.entry.kind}`} key={item.entry.id}>
                  <span className="transcript-entry-marker">{formatTranscriptMarker(item.meta)}</span>
                  <span>{item.entry.speakerName}</span>
                  <MarkdownText text={item.entry.text} />
                </article>
              ))}
            </div>
            <div className="dialogue-records-actions">
              <button className="secondary-action" type="button" onClick={() => setActiveTranscriptStage(null)}>
                关闭
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}

function annotateTranscriptEntries(entries: DialogueHistoryEntry[], stage: TranscriptStage) {
  return entries.map((entry, index) => ({
    entry,
    meta: {
      stageLabel: stage.label,
      stageOrder: stage.order,
      turnNumber: getEntryTurnNumber(entry, index),
    },
  }));
}

function getEntryTurnNumber(entry: DialogueHistoryEntry, fallbackIndex: number): number {
  if (typeof entry.turn === 'number' && Number.isFinite(entry.turn) && entry.turn >= 0) {
    return entry.turn + 1;
  }
  return fallbackIndex + 1;
}

function formatTranscriptMarker(meta: { stageLabel: string; stageOrder: number; turnNumber: number }): string {
  return `${formatStageOrder(meta.stageOrder)} · ${meta.stageLabel} · 第${formatStageOrder(meta.turnNumber)}轮`;
}

function formatStageOrder(value: number): string {
  return String(value).padStart(2, '0');
}

function groupTranscriptByStage(history: DialogueHistoryEntry[]): Record<TranscriptStageCode, DialogueHistoryEntry[]> {
  const groups = createEmptyTranscriptGroups();
  let currentStage: TranscriptStageCode = 'PLC';

  for (const entry of history) {
    if (entry.stageCode === 'SYSTEM') {
      groups[currentStage].push(entry);
      continue;
    }

    if (entry.stageCode === 'RECEPTION') {
      currentStage = getReceptionTranscriptStage(entry, currentStage);
      groups[currentStage].push(entry);
      continue;
    }

    const mappedStage = getTranscriptStageCode(entry.stageCode);
    if (mappedStage) {
      currentStage = mappedStage;
    }
    groups[currentStage].push(entry);
  }

  return groups;
}

function createEmptyTranscriptGroups(): Record<TranscriptStageCode, DialogueHistoryEntry[]> {
  return {
    PLC: [],
    CD: [],
    DLC: [],
    DD: [],
    CI: [],
    AD: [],
    AR: [],
    CIA: [],
  };
}

function getTranscriptStageCode(stageCode: string): TranscriptStageCode | null {
  const normalized = String(stageCode || '').toUpperCase();
  if (DIRECT_TRANSCRIPT_STAGE_CODES.has(normalized)) {
    return normalized as TranscriptStageCode;
  }
  return AUXILIARY_TRANSCRIPT_STAGES[normalized] || null;
}

function getReceptionTranscriptStage(entry: DialogueHistoryEntry, currentStage: TranscriptStageCode): TranscriptStageCode {
  const text = `${entry.speakerName} ${entry.text}`.trim();
  if (/被告|被起诉|收到法院送达|应诉|答辩|赵雪/.test(text)) {
    return 'DLC';
  }
  if (/原告|起诉|索赔|李婷|咨询法律问题/.test(text)) {
    return 'PLC';
  }
  return currentStage === 'DLC' ? 'DLC' : 'PLC';
}
