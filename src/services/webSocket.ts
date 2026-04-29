import { buildAuthenticatedWebSocketUrl } from './apiClient';
import { getWebSocketUrl } from './runtime';
import { getEventBus } from './eventBus';

const RECONNECT_INTERVAL_MS = 3000;
const SEND_WAIT_TIMEOUT_MS = 6000;

const MAP_EVENT_TYPES = new Set([
  'agent_spawn',
  'agent_move',
  'agent_sit',
  'agent_stand',
  'agent_bubble',
  'agent_despawn',
  'agent_goto_front_desk',
  'agent_update_dialogue',
  'agent_end_interaction',
  'agent_animate',
]);

const EVENT_NAME_BY_TYPE: Record<string, string> = {
  dialogue_update: 'ws:dialogue-update',
  case_state_change: 'ws:case-state-change',
  dialogue_gate_accepted: 'ws:dialogue-gate-accepted',
  dialogue_gate_error: 'ws:dialogue-gate-error',
  dialogue_gate_waiting: 'ws:dialogue-gate-waiting',
  runtime_progress: 'ws:runtime-progress',
  step_gate_accepted: 'ws:step-gate-accepted',
  step_gate_error: 'ws:step-gate-error',
  step_gate_waiting: 'ws:step-gate-waiting',
  scenario_start: 'ws:scenario-start',
  scenario_end: 'ws:scenario-end',
  case_runtime_issue: 'ws:case-runtime-issue',
  player_lawyer_input_required: 'ws:player-lawyer-input-required',
  player_lawyer_input_submitted: 'ws:player-lawyer-input-submitted',
  player_lawyer_document_draft_ready: 'ws:player-lawyer-document-draft-ready',
  player_lawyer_document_confirmed: 'ws:player-lawyer-document-confirmed',
  player_lawyer_error: 'ws:player-lawyer-error',
};

export class WebSocketService {
  private static instance: WebSocketService;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private shouldReconnect = true;
  private ws: WebSocket | null = null;

  static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  get connected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  async connect(url?: string): Promise<void> {
    if (this.ws && (this.ws.readyState === WebSocket.CONNECTING || this.ws.readyState === WebSocket.OPEN)) {
      return;
    }

    this.shouldReconnect = true;
    let authenticatedUrl = '';
    try {
      authenticatedUrl = await buildAuthenticatedWebSocketUrl(url || getWebSocketUrl());
    } catch (err) {
      getEventBus().emit('ws:error', {
        message: err instanceof Error ? err.message : '无法建立实时连接',
      });
      this.scheduleReconnect();
      return;
    }

    this.ws = new WebSocket(authenticatedUrl);
    const socket = this.ws;

    socket.onopen = () => {
      if (this.ws !== socket) return;
      this.sendIfOpen({
        type: 'client_ready',
        frontend_mode: 'player_v2',
        capabilities: ['dialogue_turn_gate', 'runtime_progress', 'step_gate', 'supports_player_mode'],
      });
      getEventBus().emit('ws:connected');
    };

    socket.onmessage = (event) => {
      if (this.ws !== socket) return;
      try {
        const payload = JSON.parse(event.data) as Record<string, unknown>;
        this.handleMessage(payload);
      } catch (err) {
        getEventBus().emit('ws:error', { message: err instanceof Error ? err.message : 'WebSocket 消息解析失败' });
      }
    };

    socket.onerror = () => {
      if (this.ws !== socket) return;
      getEventBus().emit('ws:error', { message: 'WebSocket 连接异常' });
    };

    socket.onclose = () => {
      if (this.ws !== socket) return;
      this.ws = null;
      if (!this.shouldReconnect) return;
      getEventBus().emit('ws:disconnected');
      this.scheduleReconnect();
    };
  }

  disconnect(): void {
    this.shouldReconnect = false;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    const socket = this.ws;
    this.ws = null;
    if (socket) {
      socket.close();
    }
  }

  send(data: Record<string, unknown>): boolean {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
      return true;
    }
    if (!this.ws || this.ws.readyState === WebSocket.CLOSED) {
      void this.connect();
    }
    getEventBus().emit('ws:error', { message: '实时连接未建立，消息暂时没有送达；系统正在尝试重连。' });
    return false;
  }

  async sendWhenReady(data: Record<string, unknown>, timeoutMs = SEND_WAIT_TIMEOUT_MS): Promise<boolean> {
    if (this.sendIfOpen(data)) return true;

    void this.connect();
    const startedAt = Date.now();
    while (Date.now() - startedAt < timeoutMs) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      if (this.sendIfOpen(data)) return true;
      if (!this.ws || this.ws.readyState === WebSocket.CLOSED) {
        void this.connect();
      }
    }

    getEventBus().emit('ws:error', { message: '实时连接未建立，消息暂时没有送达；系统正在尝试重连。' });
    return false;
  }

  async sendPlayerLawyerResponse(requestId: string, message: string): Promise<boolean> {
    return await this.sendWhenReady({
      type: 'player_lawyer_response',
      request_id: requestId,
      message,
    });
  }

  async sendDialogueContinue(gateId: string): Promise<boolean> {
    return await this.sendWhenReady({
      type: 'dialogue_continue',
      gate_id: gateId,
    });
  }

  private sendIfOpen(data: Record<string, unknown>): boolean {
    if (this.ws?.readyState !== WebSocket.OPEN) return false;
    this.ws.send(JSON.stringify(data));
    return true;
  }

  private handleMessage(payload: Record<string, unknown>): void {
    const type = String(payload.type || '');
    const eventName = EVENT_NAME_BY_TYPE[type];
    if (!eventName && type === 'agent_update_dialogue' && isReceptionAgentDialogue(payload)) {
      getEventBus().emit('ws:dialogue-update', normalizeDialoguePayload(payload));
      return;
    }
    if (!eventName && MAP_EVENT_TYPES.has(type)) {
      getEventBus().emit('ws:map-event', payload);
      return;
    }
    if (!eventName) {
      getEventBus().emit('ws:unknown', payload);
      return;
    }
    getEventBus().emit(eventName, eventName === 'ws:dialogue-update' ? normalizeDialoguePayload(payload) : payload);
  }

  private scheduleReconnect(): void {
    if (!this.shouldReconnect || this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      void this.connect();
    }, RECONNECT_INTERVAL_MS);
  }
}

export function getWebSocketService(): WebSocketService {
  return WebSocketService.getInstance();
}

function normalizeDialoguePayload(payload: Record<string, unknown>): Record<string, unknown> {
  if (payload.type !== 'agent_update_dialogue') {
    return payload;
  }
  return {
    ...payload,
    content: payload.content || payload.dialogue_text || '',
    speaker_id: payload.speaker_id || payload.agent_id || '',
  };
}

function isReceptionAgentDialogue(payload: Record<string, unknown>): boolean {
  const agentId = String(payload.agent_id || payload.speaker_id || '').toLowerCase();
  const text = String(payload.dialogue_text || payload.content || '');
  return agentId.includes('reception')
    || agentId.includes('front_desk')
    || /前台|接待|欢迎来到本所|推荐律师|分配给/.test(text);
}
