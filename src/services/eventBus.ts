type EventCallback = (payload?: Record<string, unknown>) => void;

export class EventBus {
  private static instance: EventBus;
  private readonly events = new Map<string, Set<EventCallback>>();

  static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  emit(event: string, payload?: Record<string, unknown>): void {
    const callbacks = this.events.get(event);
    if (!callbacks) return;
    callbacks.forEach((callback) => {
      try {
        callback(payload);
      } catch (err) {
        console.error(`EventBus callback failed for "${event}"`, err);
      }
    });
  }

  on(event: string, callback: EventCallback): void {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }
    this.events.get(event)?.add(callback);
  }

  off(event: string, callback: EventCallback): void {
    const callbacks = this.events.get(event);
    callbacks?.delete(callback);
    if (callbacks?.size === 0) {
      this.events.delete(event);
    }
  }

  clear(): void {
    this.events.clear();
  }
}

export function getEventBus(): EventBus {
  return EventBus.getInstance();
}
