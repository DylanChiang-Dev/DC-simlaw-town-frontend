import { buildAuthenticatedWebSocketUrl } from './apiClient';
import { getWebSocketUrl } from './runtime';
import { getEventBus } from './eventBus';

const RECONNECT_INTERVAL_MS = 3000;

const EVENT_NAME_BY_TYPE: Record<string, string> = {
  dialogue_update: 'ws:dialogue-update',
  case_state_change: 'ws:case-state-change',
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

  async connect(url: string = getWebSocketUrl()): Promise<void> {
    if (this.ws && (this.ws.readyState === WebSocket.CONNECTING || this.ws.readyState === WebSocket.OPEN)) {
      return;
    }

    this.shouldReconnect = true;
    const authenticatedUrl = await buildAuthenticatedWebSocketUrl(url);
    this.ws = new WebSocket(authenticatedUrl);

    this.ws.onopen = () => {
      this.send({ type: 'client_ready' });
      getEventBus().emit('ws:connected');
    };

    this.ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as Record<string, unknown>;
        this.handleMessage(payload);
      } catch (err) {
        getEventBus().emit('ws:error', { message: err instanceof Error ? err.message : 'WebSocket 消息解析失败' });
      }
    };

    this.ws.onerror = () => {
      getEventBus().emit('ws:error', { message: 'WebSocket 连接异常' });
    };

    this.ws.onclose = () => {
      getEventBus().emit('ws:disconnected');
      this.ws = null;
      this.scheduleReconnect();
    };
  }

  disconnect(): void {
    this.shouldReconnect = false;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  send(data: Record<string, unknown>): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  sendPlayerLawyerResponse(requestId: string, message: string): void {
    this.send({
      type: 'player_lawyer_response',
      request_id: requestId,
      message,
    });
  }

  private handleMessage(payload: Record<string, unknown>): void {
    const type = String(payload.type || '');
    const eventName = EVENT_NAME_BY_TYPE[type];
    if (!eventName) {
      getEventBus().emit('ws:unknown', payload);
      return;
    }
    getEventBus().emit(eventName, payload);
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
