import { type KeyboardEvent, type MouseEvent } from 'react';
import { characters, type DialogueScene } from '../data/runtimeScene';
import { MarkdownText } from './MarkdownText';
import type { SimulationStatus } from '../services/types';
import type { DialogueHistoryEntry, RuntimeStatus } from '../state/vnEventReducer';

const INLINE_RUNTIME_NOTICE_EXCLUDED_PHASES = new Set([
  'scenario_start',
  'scenario_end',
]);

type Props = {
  backendMode?: boolean;
  caseClosed?: boolean;
  hasPendingUserTask?: boolean;
  heldDialogueEntryId?: string;
  history?: DialogueHistoryEntry[];
  lastAcknowledgedEntry?: DialogueHistoryEntry | null;
  onAcknowledgeCurrentEntry?: (entry: DialogueHistoryEntry) => void;
  onResumeCurrentCase?: () => Promise<void>;
  scene: DialogueScene;
  runtimeError?: string;
  runtimeStatus?: RuntimeStatus;
  selectedCaseId?: string;
  simulation?: SimulationStatus | null;
  wsConnected?: boolean;
};

export function DialogueBox({
  backendMode = false,
  caseClosed = false,
  hasPendingUserTask = false,
  heldDialogueEntryId = '',
  history = [],
  lastAcknowledgedEntry = null,
  onAcknowledgeCurrentEntry,
  onResumeCurrentCase,
  runtimeError = '',
  runtimeStatus,
  selectedCaseId = '',
  scene,
  simulation = null,
  wsConnected = true,
}: Props) {
  const speaker = characters[scene.speaker];
  const transcript = backendMode ? history : [];
  const currentEntry = getVisibleCurrentEntry(transcript, heldDialogueEntryId);
  const drainedQueueNotice = backendMode && !currentEntry
    ? getBackendFallbackNotice({
      onResumeCurrentCase,
      caseClosed,
      hasPendingUserTask,
      runtimeError,
      runtimeStatus,
      selectedCaseId,
      simulation,
      wsConnected,
    })
    : null;
  const displayEntry = currentEntry || (!isBlockingNotice(drainedQueueNotice) ? lastAcknowledgedEntry : null);
  const showTranscript = backendMode && Boolean(displayEntry);
  const fallbackNotice = backendMode && !showTranscript ? drainedQueueNotice : null;
  const inlineNotice = showTranscript && !currentEntry && drainedQueueNotice && !isBlockingNotice(drainedQueueNotice) && drainedQueueNotice.message
    ? drainedQueueNotice
    : null;
  const speakerPlate = displayEntry
    ? {
      name: displayEntry.speakerName,
      role: getEntryRole(displayEntry),
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
  const showActions = Boolean(fallbackNotice?.action);
  const canAcknowledgeCurrentEntry = currentEntry?.id === heldDialogueEntryId;

  function handleDialogueBoxClick(event: MouseEvent<HTMLElement>): void {
    const target = event.target as HTMLElement;
    if (target.closest('button, a, textarea, input, select, [role="button"]')) return;
    if (canAcknowledgeCurrentEntry && currentEntry) {
      onAcknowledgeCurrentEntry?.(currentEntry);
    }
  }

  function handleDialogueBoxKeyDown(event: KeyboardEvent<HTMLElement>): void {
    const target = event.target as HTMLElement;
    if (target.closest('button, a, textarea, input, select, [role="button"]')) return;
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    if (canAcknowledgeCurrentEntry && currentEntry) {
      onAcknowledgeCurrentEntry?.(currentEntry);
    }
  }

  return (
    <section
      aria-label="角色对话"
      className={`dialogue-box ${canAcknowledgeCurrentEntry ? 'clickable' : ''}`}
      onClick={handleDialogueBoxClick}
      onKeyDown={handleDialogueBoxKeyDown}
      tabIndex={canAcknowledgeCurrentEntry ? 0 : undefined}
    >
      {inlineNotice ? (
        <div className={`dialogue-floating-status ${inlineNotice.tone}`} role="status" aria-live="polite">
          <span className="dialogue-floating-spinner" aria-hidden="true" />
          <span>{inlineNotice.message}</span>
          <span className="dialogue-floating-dots" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
        </div>
      ) : null}
      <div className="speaker-plate">
        <strong>{speakerPlate.name}</strong>
        <span>{speakerPlate.role}</span>
      </div>
      <div className="dialogue-scroll-region">
        {showTranscript ? (
          <>
            <article className={`dialogue-current-entry ${displayEntry?.kind || 'dialogue'}`} aria-label={currentEntry ? '当前对话' : '上一句对话'}>
              <MarkdownText text={displayEntry?.text || ''} />
            </article>
          </>
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
            {fallbackNotice?.action ? (
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
  if (!heldDialogueEntryId) return null;
  return history.find((entry) => entry.id === heldDialogueEntryId) || null;
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
  caseClosed: boolean;
  hasPendingUserTask: boolean;
  onResumeCurrentCase?: () => Promise<void>;
  runtimeError: string;
  runtimeStatus?: RuntimeStatus;
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
  blocking: boolean;
  message: string;
  title: string;
  tone: 'idle' | 'warn' | 'error';
};

function isBlockingNotice(notice: BackendFallbackNotice | null): boolean {
  return Boolean(notice?.blocking);
}

function getBackendFallbackNotice({
  caseClosed,
  hasPendingUserTask,
  onResumeCurrentCase,
  runtimeError,
  runtimeStatus,
  selectedCaseId,
  simulation,
  wsConnected,
}: BackendFallbackInput): BackendFallbackNotice {
  if (runtimeError) {
    return {
      blocking: true,
      message: `页面已打开，但读取案件状态失败：${runtimeError}\n\n请查看顶部运行状态；如果仍然失败，说明当前案件暂时无法继续。`,
      title: '案件状态读取失败',
      tone: 'error',
    };
  }

  if (simulation?.lastError?.message) {
    return {
      blocking: true,
      message: `案件运行出现错误：${simulation.lastError.message}\n\n当前页面不会继续展示默认对话。请先处理案件运行问题；确认需要重来时再使用右上角“重置”。`,
      title: '案件运行错误',
      tone: 'error',
    };
  }

  if (caseClosed) {
    return {
      blocking: false,
      message: '',
      title: '案件已结案',
      tone: 'idle',
    };
  }

  if (!wsConnected) {
    return {
      blocking: true,
      message: '实时连接还没有建立，页面不会显示默认案件对话。系统会自动重连；如果长时间未恢复，请查看顶部连接状态。',
      title: '实时连接未建立',
      tone: 'warn',
    };
  }

  if (simulation?.paused || simulation?.status === 'paused') {
    const caseLabel = selectedCaseId || simulation.selectedCaseId || '当前案件';
    return {
      action: onResumeCurrentCase ? { label: '继续当前案件', run: onResumeCurrentCase } : undefined,
      blocking: true,
      message: `${caseLabel} 已暂停，当前没有新的实时对话可展示。\n\n这不是新的默认案件，也不是让你从头判断。点击“继续当前案件”会从保存的案件状态恢复；如果你确认要重来，再使用右上角“重置”。`,
      title: '当前案件已暂停',
      tone: 'warn',
    };
  }

  if (hasPendingUserTask) {
    return {
      blocking: false,
      message: '等待你处理当前任务',
      title: '等待用户处理任务',
      tone: 'idle',
    };
  }

  if (!simulation) {
    return {
      blocking: true,
      message: '页面正在读取案件状态。读取完成前不会展示默认案件对话。',
      title: '正在读取案件状态',
      tone: 'idle',
    };
  }

  if (simulation.canStart && !simulation.selectedCaseId) {
    return {
      blocking: true,
      message: '当前没有运行中的案件。请在案件选择区选择案件并启动；如果案件选择区没有出现，请使用页面顶部的“刷新”。',
      title: '当前没有运行中的案件',
      tone: 'idle',
    };
  }

  if (simulation.simulationRunning || simulation.status === 'running') {
    const runtimeProgressNotice = getRuntimeProgressNotice(runtimeStatus);
    return {
      blocking: false,
      message: runtimeProgressNotice || 'Agent 正在生成下一句...',
      title: '正在等待 Agent 生成对话',
      tone: 'idle',
    };
  }

  return {
    blocking: true,
    message: '当前页面没有可展示的实时对话，也没有可继续的用户任务。请查看顶部运行状态，或在确认需要重新开始时使用右上角“重置”。',
    title: '没有可展示的案件事件',
    tone: 'idle',
  };
}

function getRuntimeProgressNotice(runtimeStatus?: RuntimeStatus): string {
  if (!runtimeStatus || runtimeStatus.blocking) return '';
  const phase = String(runtimeStatus.phase || '').trim();
  const message = String(runtimeStatus.message || '').trim();
  if (INLINE_RUNTIME_NOTICE_EXCLUDED_PHASES.has(phase)) return '';
  if (!message || ['idle', 'connected', 'disconnected', 'ws_error'].includes(phase)) return '';
  return runtimeStatus.detail ? `${message} ${runtimeStatus.detail}` : message;
}
