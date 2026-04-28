import { useState, type KeyboardEvent, type MouseEvent } from 'react';
import { characters, type DialogueScene } from '../data/runtimeScene';
import { MarkdownText } from './MarkdownText';
import type { SimulationStatus } from '../services/types';
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
  onAcknowledgeCurrentEntry?: (entry: DialogueHistoryEntry) => void;
  onContinueDialogue?: () => void;
  onRefreshRuntime?: () => Promise<void>;
  onResumeCurrentCase?: () => Promise<void>;
  scene: DialogueScene;
  runtimeError?: string;
  selectedCaseId?: string;
  simulation?: SimulationStatus | null;
  wsConnected?: boolean;
};

export function DialogueBox({
  backendMode = false,
  dialogueGate = null,
  history = [],
  onContinueDialogue,
  onAcknowledgeCurrentEntry,
  onRefreshRuntime,
  onResumeCurrentCase,
  runtimeError = '',
  selectedCaseId = '',
  scene,
  simulation = null,
  wsConnected = true,
}: Props) {
  const [recordsOpen, setRecordsOpen] = useState(false);
  const speaker = characters[scene.speaker];
  const transcript = backendMode ? history : [];
  const currentEntry = getVisibleCurrentEntry(transcript);
  const showTranscript = backendMode && Boolean(currentEntry);
  const canOpenTranscript = backendMode && transcript.length > 1;
  const fallbackNotice = backendMode && !showTranscript && !dialogueGate
    ? getBackendFallbackNotice({
      onRefreshRuntime,
      onResumeCurrentCase,
      runtimeError,
      selectedCaseId,
      simulation,
      wsConnected,
    })
    : null;
  const speakerPlate = currentEntry
    ? {
      name: currentEntry.speakerName,
      role: getEntryRole(currentEntry),
    }
    : fallbackNotice
      ? {
        name: '系统',
        role: getFallbackRole(fallbackNotice),
      }
      : {
        name: scene.speakerLabel || speaker.name,
        role: speaker.role,
      };
  const showActions = Boolean(dialogueGate || canOpenTranscript || fallbackNotice?.action);
  const canClickToContinue = Boolean(dialogueGate && !dialogueGate.pending && wsConnected && onContinueDialogue);

  function handleDialogueBoxClick(event: MouseEvent<HTMLElement>): void {
    const target = event.target as HTMLElement;
    if (target.closest('button, a, textarea, input, select, [role="button"]')) return;
    if (currentEntry?.kind === 'dialogue') {
      onAcknowledgeCurrentEntry?.(currentEntry);
    }
    if (!canClickToContinue) return;
    onContinueDialogue?.();
  }

  function handleDialogueBoxKeyDown(event: KeyboardEvent<HTMLElement>): void {
    const target = event.target as HTMLElement;
    if (target.closest('button, a, textarea, input, select, [role="button"]')) return;
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    if (currentEntry?.kind === 'dialogue') {
      onAcknowledgeCurrentEntry?.(currentEntry);
    }
    if (!canClickToContinue) return;
    onContinueDialogue?.();
  }

  return (
    <section
      aria-label="角色对话"
      className={`dialogue-box ${canClickToContinue ? 'clickable' : ''}`}
      onClick={handleDialogueBoxClick}
      onKeyDown={handleDialogueBoxKeyDown}
      tabIndex={canClickToContinue ? 0 : undefined}
    >
      <div className="speaker-plate">
        <strong>{speakerPlate.name}</strong>
        <span>{speakerPlate.role}</span>
      </div>
      <div className="dialogue-scroll-region">
        {showTranscript ? (
          <article className={`dialogue-current-entry ${currentEntry?.kind || 'dialogue'}`} aria-label="当前对话">
            <MarkdownText text={currentEntry?.text || ''} />
          </article>
        ) : fallbackNotice ? (
          <div className={`dialogue-runtime-notice ${fallbackNotice.tone}`} role={fallbackNotice.tone === 'error' ? 'alert' : 'status'}>
            <strong>{fallbackNotice.title}</strong>
            <MarkdownText text={fallbackNotice.message} />
          </div>
        ) : (
          <MarkdownText className="dialogue-current-text" text={scene.text} />
        )}
      </div>
      {showActions && <div className="dialogue-actions">
        {backendMode ? (
          <>
            {dialogueGate && (
              <div className="dialogue-gate-notice" role="status">
                <strong>下一句已准备好</strong>
                <span>
                  {dialogueGate.pending
                    ? '已请求后端继续，正在等待响应。'
                    : `后端正在等待继续${dialogueGate.speakerName ? `：${dialogueGate.speakerName}` : ''}。点击“继续”或直接点击对话框推进。`}
                </span>
              </div>
            )}
            {canOpenTranscript && (
              <button className="secondary-action" type="button" onClick={() => setRecordsOpen(true)}>
                查看全部记录
              </button>
            )}
            {dialogueGate ? (
              <button disabled={dialogueGate.pending || !wsConnected} type="button" onClick={onContinueDialogue}>
                {!wsConnected ? '实时未连接，正在重连' : dialogueGate.pending ? '等待后端响应' : '继续'}
              </button>
            ) : fallbackNotice?.action ? (
              <button className={fallbackNotice.action.kind === 'secondary' ? 'secondary-action' : undefined} type="button" onClick={() => void fallbackNotice.action?.run()}>
                {fallbackNotice.action.label}
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

function getVisibleCurrentEntry(history: DialogueHistoryEntry[]): DialogueHistoryEntry | null {
  return history[history.length - 1] || null;
}

function getEntryRole(entry: DialogueHistoryEntry): string {
  if (entry.kind === 'system') {
    return '流程提示';
  }
  if (entry.kind === 'error') {
    return '异常提示';
  }
  if (entry.stageCode === 'RECEPTION' || entry.speaker === 'receptionist') {
    return '前台接待与律师推荐';
  }
  return characters[entry.speaker].role;
}

function getFallbackRole(notice: BackendFallbackNotice): string {
  if (notice.tone === 'error') return '异常提示';
  if (notice.tone === 'warn') return '状态提示';
  return '流程提示';
}

type BackendFallbackInput = {
  onRefreshRuntime?: () => Promise<void>;
  onResumeCurrentCase?: () => Promise<void>;
  runtimeError: string;
  selectedCaseId: string;
  simulation: SimulationStatus | null;
  wsConnected: boolean;
};

type BackendFallbackNotice = {
  action?: {
    kind?: 'primary' | 'secondary';
    label: string;
    run: () => Promise<void>;
  };
  message: string;
  title: string;
  tone: 'idle' | 'warn' | 'error';
};

function getBackendFallbackNotice({
  onRefreshRuntime,
  onResumeCurrentCase,
  runtimeError,
  selectedCaseId,
  simulation,
  wsConnected,
}: BackendFallbackInput): BackendFallbackNotice {
  if (runtimeError) {
    return {
      action: onRefreshRuntime ? { kind: 'secondary', label: '刷新状态', run: onRefreshRuntime } : undefined,
      message: `前端已经打开，但读取沙盒案件状态失败：${runtimeError}\n\n请先刷新状态；如果仍然失败，说明当前页面没有从后端拿到可继续的案件状态。`,
      title: '案件状态读取失败',
      tone: 'error',
    };
  }

  if (simulation?.lastError?.message) {
    return {
      action: onRefreshRuntime ? { kind: 'secondary', label: '刷新状态', run: onRefreshRuntime } : undefined,
      message: `后端返回了案件运行错误：${simulation.lastError.message}\n\n当前页面不会继续展示默认对话。请刷新状态；如果错误仍在，需要先处理后端运行问题。`,
      title: '后端案件运行错误',
      tone: 'error',
    };
  }

  if (!wsConnected) {
    return {
      action: onRefreshRuntime ? { kind: 'secondary', label: '刷新状态', run: onRefreshRuntime } : undefined,
      message: '实时连接还没有建立，页面不会显示默认案件对话。系统会自动重连；如果长时间未恢复，请刷新状态。',
      title: '实时连接未建立',
      tone: 'warn',
    };
  }

  if (simulation?.paused || simulation?.status === 'paused') {
    const caseLabel = selectedCaseId || simulation.selectedCaseId || '当前案件';
    return {
      action: onResumeCurrentCase ? { label: '继续当前案件', run: onResumeCurrentCase } : undefined,
      message: `${caseLabel} 已暂停，当前没有新的实时对话可展示。\n\n这不是新的默认案件，也不是让你从头判断。点击“继续当前案件”会请求后端从保存的案件状态恢复；如果你确认要重来，再使用右上角“重置”。`,
      title: '当前案件已暂停',
      tone: 'warn',
    };
  }

  if (!simulation) {
    return {
      action: onRefreshRuntime ? { kind: 'secondary', label: '刷新状态', run: onRefreshRuntime } : undefined,
      message: '页面正在读取后端案件状态。读取完成前不会展示默认案件对话。',
      title: '正在读取后端状态',
      tone: 'idle',
    };
  }

  if (simulation.canStart && !simulation.selectedCaseId) {
    return {
      action: onRefreshRuntime ? { kind: 'secondary', label: '刷新状态', run: onRefreshRuntime } : undefined,
      message: '当前没有运行中的案件。请在案件选择区选择案件并启动；如果案件选择区没有出现，请刷新状态。',
      title: '当前没有运行中的案件',
      tone: 'idle',
    };
  }

  if (simulation.simulationRunning || simulation.status === 'running') {
    return {
      action: onRefreshRuntime ? { kind: 'secondary', label: '刷新状态', run: onRefreshRuntime } : undefined,
      message: '后端显示案件正在运行，但前端还没有收到下一条实时对话。请稍等；如果状态长时间不变，请刷新状态。',
      title: '等待后端返回下一条事件',
      tone: 'idle',
    };
  }

  return {
    action: onRefreshRuntime ? { kind: 'secondary', label: '刷新状态', run: onRefreshRuntime } : undefined,
    message: '当前页面没有可展示的实时对话，也没有可继续的用户任务。请刷新状态，或在确认需要重新开始时使用右上角“重置”。',
    title: '没有可展示的案件事件',
    tone: 'idle',
  };
}
