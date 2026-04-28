import { useCallback, useEffect, useState } from 'react';
import {
  draftPlayerLawyerResponse,
  fetchPendingPlayerLawyerRequests,
  fetchPlayerLawyerStatus,
  polishPlayerLawyerResponse,
  submitPlayerLawyerResponse,
} from '../services/playerLawyerApi';
import { getEventBus } from '../services/eventBus';
import type {
  PlayerLawyerDraftInput,
  PlayerLawyerPolishInput,
  PlayerLawyerRequest,
  PlayerLawyerResponseAssist,
  PlayerLawyerStatus,
  PlayerLawyerTextSubmitInput,
} from '../services/types';

const POLL_INTERVAL_MS = 10000;
const PLAYER_MODE_NEGOTIATING_MESSAGE = 'Player-lawyer mode is not enabled';

type PlayerLawyerPayload = {
  data?: Record<string, unknown>;
} & Record<string, unknown>;

export type PlayerLawyerRuntimeState = {
  actionLoading: boolean;
  activeRequest: PlayerLawyerRequest | null;
  error: string;
  loading: boolean;
  status: PlayerLawyerStatus | null;
  draftTextReply: (input: Omit<PlayerLawyerDraftInput, 'requestId'>) => Promise<PlayerLawyerResponseAssist>;
  refresh: () => Promise<void>;
  polishTextReply: (input: Omit<PlayerLawyerPolishInput, 'requestId'>) => Promise<PlayerLawyerResponseAssist>;
  submitTextReply: (input: Omit<PlayerLawyerTextSubmitInput, 'requestId'>) => Promise<void>;
};

export function usePlayerLawyerRuntime(enabled: boolean, caseId?: string): PlayerLawyerRuntimeState {
  const [activeRequest, setActiveRequest] = useState<PlayerLawyerRequest | null>(null);
  const [error, setError] = useState('');
  const [refreshLoading, setRefreshLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [status, setStatus] = useState<PlayerLawyerStatus | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    setRefreshLoading(true);
    setError('');
    try {
      const [nextStatus, pending] = await Promise.all([
        fetchPlayerLawyerStatus(),
        fetchPendingPlayerLawyerRequests(caseId),
      ]);
      setStatus(nextStatus);
      setActiveRequest(pending[pending.length - 1] || null);
    } catch (err) {
      setActiveRequest(null);
      if (isPlayerLawyerModeNegotiatingError(err)) {
        setError('');
      } else {
        setError(err instanceof Error ? err.message : '读取用户任务失败');
      }
    } finally {
      setRefreshLoading(false);
    }
  }, [caseId, enabled]);

  useEffect(() => {
    if (!enabled) {
      setActiveRequest(null);
      setError('');
      setStatus(null);
      return;
    }

    void refresh();
    const timer = window.setInterval(() => void refresh(), POLL_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [enabled, refresh]);

  useEffect(() => {
    if (!enabled) return;

    const eventBus = getEventBus();
    const handleRequired = (payload?: Record<string, unknown>) => {
      const request = mapPlayerLawyerRequestPayload(payload || {});
      if (request.requestId) {
        setActiveRequest(request);
      } else {
        void refresh();
      }
    };
    const handleCleared = () => {
      setActiveRequest(null);
      void refresh();
    };
    const handleError = (payload?: Record<string, unknown>) => {
      const message = readPayloadMessage(payload);
      if (isPlayerLawyerModeNegotiatingError(message)) {
        setError('');
        return;
      }
      setError(message || '用户任务处理失败');
    };
    const handleConnected = () => {
      void refresh();
    };

    eventBus.on('ws:player-lawyer-input-required', handleRequired);
    eventBus.on('ws:player-lawyer-input-submitted', handleCleared);
    eventBus.on('ws:player-lawyer-document-confirmed', handleCleared);
    eventBus.on('ws:player-lawyer-error', handleError);
    eventBus.on('ws:connected', handleConnected);

    return () => {
      eventBus.off('ws:player-lawyer-input-required', handleRequired);
      eventBus.off('ws:player-lawyer-input-submitted', handleCleared);
      eventBus.off('ws:player-lawyer-document-confirmed', handleCleared);
      eventBus.off('ws:player-lawyer-error', handleError);
      eventBus.off('ws:connected', handleConnected);
    };
  }, [enabled, refresh]);

  async function polishTextReply(input: Omit<PlayerLawyerPolishInput, 'requestId'>): Promise<PlayerLawyerResponseAssist> {
    if (!activeRequest) {
      throw new Error('当前没有待处理的用户任务');
    }
    setActionLoading(true);
    setError('');
    try {
      return await polishPlayerLawyerResponse({
        requestId: activeRequest.requestId,
        originalMessage: input.originalMessage,
        hintIds: input.hintIds,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'AI 润色失败';
      setError(message);
      throw err;
    } finally {
      setActionLoading(false);
    }
  }

  async function draftTextReply(input: Omit<PlayerLawyerDraftInput, 'requestId'>): Promise<PlayerLawyerResponseAssist> {
    if (!activeRequest) {
      throw new Error('当前没有待处理的用户任务');
    }
    setActionLoading(true);
    setError('');
    try {
      return await draftPlayerLawyerResponse({
        requestId: activeRequest.requestId,
        hintIds: input.hintIds,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'AI 代答失败';
      setError(message);
      throw err;
    } finally {
      setActionLoading(false);
    }
  }

  async function submitTextReply(input: Omit<PlayerLawyerTextSubmitInput, 'requestId'>): Promise<void> {
    if (!activeRequest) {
      throw new Error('当前没有待处理的用户任务');
    }
    setActionLoading(true);
    setError('');
    try {
      await submitPlayerLawyerResponse({
        requestId: activeRequest.requestId,
        message: input.message,
        originalMessage: input.originalMessage,
        polishedMessage: input.polishedMessage,
        finalMessage: input.finalMessage || input.message,
        hintIds: input.hintIds || [],
        usedAiPolish: Boolean(input.usedAiPolish),
      });
      setActiveRequest(null);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : '提交当前角色回复失败');
      throw err;
    } finally {
      setActionLoading(false);
    }
  }

  return {
    actionLoading,
    activeRequest,
    error,
    draftTextReply,
    loading: refreshLoading || actionLoading,
    status,
    refresh,
    polishTextReply,
    submitTextReply,
  };
}

function unwrapPayload(payload: PlayerLawyerPayload): Record<string, unknown> {
  return payload.data && typeof payload.data === 'object' ? payload.data : payload;
}

function mapPlayerLawyerRequestPayload(payload: PlayerLawyerPayload): PlayerLawyerRequest {
  const data = unwrapPayload(payload);
  return {
    requestId: String(data.request_id || '').trim(),
    sandboxId: Number(data.sandbox_id || 0),
    caseId: String(data.case_id || '').trim(),
    stage: String(data.stage || '').trim(),
    role: String(data.role || '').trim(),
    speakerLabel: String(data.speaker_label || '').trim(),
    prompt: String(data.prompt || ''),
    contextSummary: String(data.context_summary || ''),
    status: String(data.status || '').trim(),
    message: String(data.message || ''),
    createdAt: String(data.created_at || ''),
    submittedAt: (data.submitted_at as string | null | undefined) ?? null,
  };
}

function readPayloadMessage(payload?: Record<string, unknown>): string {
  if (!payload) return '';
  const data = payload.data && typeof payload.data === 'object'
    ? payload.data as Record<string, unknown>
    : payload;
  return String(data.message || '').trim();
}

function isPlayerLawyerModeNegotiatingError(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err || '');
  return message.includes(PLAYER_MODE_NEGOTIATING_MESSAGE);
}
