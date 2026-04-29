import { type KeyboardEvent, type MouseEvent } from 'react';
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
  heldDialogueEntryId?: string;
  history?: DialogueHistoryEntry[];
  onAcknowledgeCurrentEntry?: (entry: DialogueHistoryEntry) => void;
  onContinueDialogue?: () => void;
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
  heldDialogueEntryId = '',
  history = [],
  onContinueDialogue,
  onAcknowledgeCurrentEntry,
  onResumeCurrentCase,
  runtimeError = '',
  selectedCaseId = '',
  scene,
  simulation = null,
  wsConnected = true,
}: Props) {
  const speaker = characters[scene.speaker];
  const transcript = backendMode ? history : [];
  const currentEntry = getVisibleCurrentEntry(transcript, heldDialogueEntryId);
  const showTranscript = backendMode && Boolean(currentEntry);
  const fallbackNotice = backendMode && !showTranscript && !dialogueGate
    ? getBackendFallbackNotice({
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
  const showActions = Boolean(dialogueGate || fallbackNotice?.action);
  const canClickToContinue = Boolean(dialogueGate && !dialogueGate.pending && wsConnected && onContinueDialogue);

  function handleDialogueBoxClick(event: MouseEvent<HTMLElement>): void {
    const target = event.target as HTMLElement;
    if (target.closest('button, a, textarea, input, select, [role="button"]')) return;
    if (currentEntry?.id === heldDialogueEntryId) {
      onAcknowledgeCurrentEntry?.(currentEntry);
      return;
    }
    if (!canClickToContinue) return;
    onContinueDialogue?.();
  }

  function handleDialogueBoxKeyDown(event: KeyboardEvent<HTMLElement>): void {
    const target = event.target as HTMLElement;
    if (target.closest('button, a, textarea, input, select, [role="button"]')) return;
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    if (currentEntry?.id === heldDialogueEntryId) {
      onAcknowledgeCurrentEntry?.(currentEntry);
      return;
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
                    ? '已请求继续，正在等待响应。'
                    : `下一句已准备好${dialogueGate.speakerName ? `：${dialogueGate.speakerName}` : ''}。点击“继续”或直接点击对话框推进。`}
                </span>
              </div>
            )}
            {dialogueGate ? (
              <button disabled={dialogueGate.pending || !wsConnected} type="button" onClick={onContinueDialogue}>
                {!wsConnected ? '实时未连接，正在重连' : dialogueGate.pending ? '等待响应' : '继续'}
              </button>
            ) : fallbackNotice?.action ? (
              <button className={fallbackNotice.action.kind === 'secondary' ? 'secondary-action' : undefined} type="button" onClick={() => void fallbackNotice.action?.run()}>
                {fallbackNotice.action.label}
              </button>
            ) : null}
          </>
        ) : null}
      </div>}
    </section>
  );
}

function getVisibleCurrentEntry(history: DialogueHistoryEntry[], heldDialogueEntryId = ''): DialogueHistoryEntry | null {
  const heldEntry = history.find((entry) => entry.id === heldDialogueEntryId);
  return heldEntry || history[history.length - 1] || null;
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
  onResumeCurrentCase,
  runtimeError,
  selectedCaseId,
  simulation,
  wsConnected,
}: BackendFallbackInput): BackendFallbackNotice {
  if (runtimeError) {
    return {
      message: `页面已打开，但读取案件状态失败：${runtimeError}\n\n请查看顶部运行状态；如果仍然失败，说明当前案件暂时无法继续。`,
      title: '案件状态读取失败',
      tone: 'error',
    };
  }

  if (simulation?.lastError?.message) {
    return {
      message: `案件运行出现错误：${simulation.lastError.message}\n\n当前页面不会继续展示默认对话。请先处理案件运行问题；确认需要重来时再使用右上角“重置”。`,
      title: '案件运行错误',
      tone: 'error',
    };
  }

  if (!wsConnected) {
    return {
      message: '实时连接还没有建立，页面不会显示默认案件对话。系统会自动重连；如果长时间未恢复，请查看顶部连接状态。',
      title: '实时连接未建立',
      tone: 'warn',
    };
  }

  if (simulation?.paused || simulation?.status === 'paused') {
    const caseLabel = selectedCaseId || simulation.selectedCaseId || '当前案件';
    return {
      action: onResumeCurrentCase ? { label: '继续当前案件', run: onResumeCurrentCase } : undefined,
      message: `${caseLabel} 已暂停，当前没有新的实时对话可展示。\n\n这不是新的默认案件，也不是让你从头判断。点击“继续当前案件”会从保存的案件状态恢复；如果你确认要重来，再使用右上角“重置”。`,
      title: '当前案件已暂停',
      tone: 'warn',
    };
  }

  if (!simulation) {
    return {
      message: '页面正在读取案件状态。读取完成前不会展示默认案件对话。',
      title: '正在读取案件状态',
      tone: 'idle',
    };
  }

  if (simulation.canStart && !simulation.selectedCaseId) {
    return {
      message: '当前没有运行中的案件。请在案件选择区选择案件并启动；如果案件选择区没有出现，请使用页面顶部的“刷新”。',
      title: '当前没有运行中的案件',
      tone: 'idle',
    };
  }

  if (simulation.simulationRunning || simulation.status === 'running') {
    return {
      message: '案件正在运行，但页面还没有收到下一条实时对话。系统会继续等待实时连接推送；如果长时间没有变化，请查看顶部连接状态或确认是否需要重置。',
      title: '等待下一条案件进展',
      tone: 'idle',
    };
  }

  return {
    message: '当前页面没有可展示的实时对话，也没有可继续的用户任务。请查看顶部运行状态，或在确认需要重新开始时使用右上角“重置”。',
    title: '没有可展示的案件事件',
    tone: 'idle',
  };
}
