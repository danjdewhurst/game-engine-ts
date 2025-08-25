import type { EntityId, Component } from '../types';

// Base event interface
export interface GameEvent {
  type: string;
  timestamp: number;
  source?: string;
}

// Entity lifecycle events
export interface EntityCreatedEvent extends GameEvent {
  type: 'entity:created';
  entityId: EntityId;
}

export interface EntityDestroyedEvent extends GameEvent {
  type: 'entity:destroyed';
  entityId: EntityId;
}

export interface ComponentAddedEvent extends GameEvent {
  type: 'component:added';
  entityId: EntityId;
  component: Component;
}

export interface ComponentRemovedEvent extends GameEvent {
  type: 'component:removed';
  entityId: EntityId;
  componentType: string;
}

export interface ComponentModifiedEvent extends GameEvent {
  type: 'component:modified';
  entityId: EntityId;
  componentType: string;
  oldValue?: any;
  newValue?: any;
}

// System events
export interface SystemAddedEvent extends GameEvent {
  type: 'system:added';
  systemName: string;
}

export interface SystemRemovedEvent extends GameEvent {
  type: 'system:removed';
  systemName: string;
}

export interface SystemUpdateStartEvent extends GameEvent {
  type: 'system:update:start';
  systemName: string;
  deltaTime: number;
  entityCount: number;
}

export interface SystemUpdateEndEvent extends GameEvent {
  type: 'system:update:end';
  systemName: string;
  deltaTime: number;
  entityCount: number;
  duration: number;
}

// Engine lifecycle events
export interface EngineStartedEvent extends GameEvent {
  type: 'engine:started';
  targetFPS: number;
}

export interface EngineStoppedEvent extends GameEvent {
  type: 'engine:stopped';
}

export interface EnginePausedEvent extends GameEvent {
  type: 'engine:paused';
}

export interface EngineResumedEvent extends GameEvent {
  type: 'engine:resumed';
}

export interface EngineTickEvent extends GameEvent {
  type: 'engine:tick';
  deltaTime: number;
  fps: number;
  entityCount: number;
}

// Collision events (integrated with main event system)
export interface CollisionDetectedEvent extends GameEvent {
  type: 'collision:detected';
  entityA: EntityId;
  entityB: EntityId;
  collision: any; // Will be defined by collision system
}

export interface TriggerActivatedEvent extends GameEvent {
  type: 'trigger:activated';
  entityA: EntityId;
  entityB: EntityId;
  collision: any;
}

// Custom user events
export interface CustomEvent extends GameEvent {
  type: string;
  data?: any;
}

// Union type for all events
export type AllGameEvents =
  | EntityCreatedEvent
  | EntityDestroyedEvent
  | ComponentAddedEvent
  | ComponentRemovedEvent
  | ComponentModifiedEvent
  | SystemAddedEvent
  | SystemRemovedEvent
  | SystemUpdateStartEvent
  | SystemUpdateEndEvent
  | EngineStartedEvent
  | EngineStoppedEvent
  | EnginePausedEvent
  | EngineResumedEvent
  | EngineTickEvent
  | CollisionDetectedEvent
  | TriggerActivatedEvent
  | CustomEvent;

// Event listener types
export type EventListener<T extends GameEvent = GameEvent> = (event: T) => void;
export type EventListenerWithContext<T extends GameEvent = GameEvent> = (
  event: T,
  context?: any
) => void;

// Event filter function
export type EventFilter<T extends GameEvent = GameEvent> = (
  event: T
) => boolean;

// Event subscription interface
export interface EventSubscription {
  unsubscribe(): void;
}

export class EventDispatcher {
  private listeners = new Map<string, EventListener[]>();
  private oneTimeListeners = new Map<string, EventListener[]>();
  private globalListeners: EventListener[] = [];
  private eventHistory: GameEvent[] = [];
  private maxHistorySize = 1000;

  // Add event listener
  public on<T extends GameEvent>(
    eventType: T['type'],
    listener: EventListener<T>
  ): EventSubscription {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }

    const typedListener = listener as EventListener;
    this.listeners.get(eventType)!.push(typedListener);

    return {
      unsubscribe: () => {
        const listeners = this.listeners.get(eventType);
        if (listeners) {
          const index = listeners.indexOf(typedListener);
          if (index !== -1) {
            listeners.splice(index, 1);
          }
        }
      },
    };
  }

  // Add one-time event listener
  public once<T extends GameEvent>(
    eventType: T['type'],
    listener: EventListener<T>
  ): EventSubscription {
    if (!this.oneTimeListeners.has(eventType)) {
      this.oneTimeListeners.set(eventType, []);
    }

    const typedListener = listener as EventListener;
    this.oneTimeListeners.get(eventType)!.push(typedListener);

    return {
      unsubscribe: () => {
        const listeners = this.oneTimeListeners.get(eventType);
        if (listeners) {
          const index = listeners.indexOf(typedListener);
          if (index !== -1) {
            listeners.splice(index, 1);
          }
        }
      },
    };
  }

  // Add global event listener (receives all events)
  public onAll(listener: EventListener): EventSubscription {
    this.globalListeners.push(listener);

    return {
      unsubscribe: () => {
        const index = this.globalListeners.indexOf(listener);
        if (index !== -1) {
          this.globalListeners.splice(index, 1);
        }
      },
    };
  }

  // Emit event
  public emit<T extends GameEvent>(event: T): void {
    // Add timestamp if not present
    if (!event.timestamp) {
      event.timestamp = Date.now();
    }

    // Add to history
    this.addToHistory(event);

    // Notify specific listeners
    const listeners = this.listeners.get(event.type) || [];
    for (const listener of listeners) {
      try {
        listener(event);
      } catch (error) {
        console.error(`Error in event listener for ${event.type}:`, error);
      }
    }

    // Notify one-time listeners
    const oneTimeListeners = this.oneTimeListeners.get(event.type) || [];
    if (oneTimeListeners.length > 0) {
      // Clear one-time listeners after calling them
      this.oneTimeListeners.set(event.type, []);

      for (const listener of oneTimeListeners) {
        try {
          listener(event);
        } catch (error) {
          console.error(
            `Error in one-time event listener for ${event.type}:`,
            error
          );
        }
      }
    }

    // Notify global listeners
    for (const listener of this.globalListeners) {
      try {
        listener(event);
      } catch (error) {
        console.error(`Error in global event listener:`, error);
      }
    }
  }

  // Remove all listeners for a specific event type
  public removeAllListeners(eventType: string): void {
    this.listeners.delete(eventType);
    this.oneTimeListeners.delete(eventType);
  }

  // Remove all listeners
  public removeAllGlobalListeners(): void {
    this.globalListeners = [];
  }

  // Clear all listeners
  public clear(): void {
    this.listeners.clear();
    this.oneTimeListeners.clear();
    this.globalListeners = [];
  }

  // Get event history
  public getEventHistory(eventType?: string, limit?: number): GameEvent[] {
    let events = eventType
      ? this.eventHistory.filter((e) => e.type === eventType)
      : this.eventHistory;

    if (limit) {
      events = events.slice(-limit);
    }

    return [...events]; // Return copy
  }

  // Add event to history
  private addToHistory(event: GameEvent): void {
    this.eventHistory.push({ ...event }); // Store copy

    // Maintain history size limit
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory = this.eventHistory.slice(-this.maxHistorySize);
    }
  }

  // Get listener count for an event type
  public getListenerCount(eventType: string): number {
    const regular = this.listeners.get(eventType)?.length || 0;
    const oneTime = this.oneTimeListeners.get(eventType)?.length || 0;
    return regular + oneTime;
  }

  // Check if there are listeners for an event type
  public hasListeners(eventType: string): boolean {
    return (
      this.getListenerCount(eventType) > 0 || this.globalListeners.length > 0
    );
  }

  // Utility method to create event with timestamp
  public createEvent<T extends Omit<GameEvent, 'timestamp'>>(
    event: T
  ): T & { timestamp: number } {
    return {
      ...event,
      timestamp: Date.now(),
    };
  }

  // Advanced filtering and querying
  public onFiltered<T extends GameEvent>(
    eventType: T['type'],
    filter: EventFilter<T>,
    listener: EventListener<T>
  ): EventSubscription {
    const wrappedListener: EventListener<T> = (event) => {
      if (filter(event)) {
        listener(event);
      }
    };

    return this.on(eventType, wrappedListener);
  }

  // Batch emit events
  public emitBatch(events: GameEvent[]): void {
    for (const event of events) {
      this.emit(event);
    }
  }

  // Get statistics about event system usage
  public getStats() {
    const listenerCounts = new Map<string, number>();

    for (const [eventType, listeners] of this.listeners) {
      listenerCounts.set(eventType, listeners.length);
    }

    for (const [eventType, listeners] of this.oneTimeListeners) {
      const existing = listenerCounts.get(eventType) || 0;
      listenerCounts.set(eventType, existing + listeners.length);
    }

    return {
      totalEventTypes: listenerCounts.size,
      totalListeners: Array.from(listenerCounts.values()).reduce(
        (sum, count) => sum + count,
        0
      ),
      globalListeners: this.globalListeners.length,
      eventHistorySize: this.eventHistory.length,
      listenersByType: Object.fromEntries(listenerCounts),
    };
  }
}

// Global event dispatcher instance
export const globalEventDispatcher = new EventDispatcher();
