import type {
  Entity,
  EntityId,
  System,
  GameEngineOptions,
  GameLoop,
  Component,
} from '../types';
import { EntityManager } from '../entities/EntityManager';
import { globalEventDispatcher } from '../events/EventDispatcher';
import type {
  SystemAddedEvent,
  SystemRemovedEvent,
  SystemUpdateStartEvent,
  SystemUpdateEndEvent,
  EngineStartedEvent,
  EngineStoppedEvent,
  EnginePausedEvent,
  EngineResumedEvent,
  EngineTickEvent,
} from '../events/EventDispatcher';

export class GameEngine implements GameLoop {
  private entityManager: EntityManager;
  private systems: System[] = [];
  private intervalId?: Timer;
  private lastFrameTime = 0;
  private deltaTime = 0;

  public isRunning = false;
  public isPaused = false;

  private readonly targetFPS: number;
  private readonly frameInterval: number;

  constructor(options: GameEngineOptions = {}) {
    this.targetFPS = options.targetFPS ?? 60;
    this.frameInterval = 1000 / this.targetFPS;
    this.entityManager = new EntityManager(options.maxEntities);
  }

  public addSystem(system: System): void {
    this.systems.push(system);

    // Emit system added event
    const event: SystemAddedEvent = {
      type: 'system:added',
      systemName: system.name,
      timestamp: Date.now(),
      source: 'GameEngine',
    };
    globalEventDispatcher.emit(event);
  }

  public removeSystem(name: string): void {
    const initialLength = this.systems.length;
    this.systems = this.systems.filter((system) => system.name !== name);

    // Emit system removed event if a system was actually removed
    if (this.systems.length < initialLength) {
      const event: SystemRemovedEvent = {
        type: 'system:removed',
        systemName: name,
        timestamp: Date.now(),
        source: 'GameEngine',
      };
      globalEventDispatcher.emit(event);
    }
  }

  // Expose EntityManager methods
  public createEntity(): Entity {
    return this.entityManager.createEntity();
  }

  public getEntity(id: EntityId): Entity | undefined {
    return this.entityManager.getEntity(id);
  }

  public destroyEntity(id: EntityId): void {
    this.entityManager.destroyEntity(id);
  }

  public addComponent<T extends Component>(
    entityId: EntityId,
    component: T
  ): void {
    this.entityManager.addComponent(entityId, component);
  }

  public removeComponent(entityId: EntityId, componentType: string): void {
    this.entityManager.removeComponent(entityId, componentType);
  }

  public getComponent<T extends Component>(
    entityId: EntityId,
    componentType: string
  ): T | undefined {
    return this.entityManager.getComponent(entityId, componentType);
  }

  public hasComponent(entityId: EntityId, componentType: string): boolean {
    return this.entityManager.hasComponent(entityId, componentType);
  }

  public getEntitiesWithComponent(componentType: string): Entity[] {
    return this.entityManager.getEntitiesWithComponent(componentType);
  }

  public getEntitiesWithComponents(componentTypes: string[]): Entity[] {
    return this.entityManager.getEntitiesWithComponents(componentTypes);
  }

  public start(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    this.isPaused = false;
    this.lastFrameTime = performance.now();

    this.intervalId = setInterval(() => this.tick(), this.frameInterval);

    // Emit engine started event
    const event: EngineStartedEvent = {
      type: 'engine:started',
      targetFPS: this.targetFPS,
      timestamp: Date.now(),
      source: 'GameEngine',
    };
    globalEventDispatcher.emit(event);
  }

  public stop(): void {
    if (!this.isRunning) return;

    this.isRunning = false;
    this.isPaused = false;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }

    // Emit engine stopped event
    const event: EngineStoppedEvent = {
      type: 'engine:stopped',
      timestamp: Date.now(),
      source: 'GameEngine',
    };
    globalEventDispatcher.emit(event);
  }

  public pause(): void {
    if (!this.isRunning || this.isPaused) return;
    this.isPaused = true;

    // Emit engine paused event
    const event: EnginePausedEvent = {
      type: 'engine:paused',
      timestamp: Date.now(),
      source: 'GameEngine',
    };
    globalEventDispatcher.emit(event);
  }

  public resume(): void {
    if (!this.isRunning || !this.isPaused) return;
    this.isPaused = false;
    this.lastFrameTime = performance.now();

    // Emit engine resumed event
    const event: EngineResumedEvent = {
      type: 'engine:resumed',
      timestamp: Date.now(),
      source: 'GameEngine',
    };
    globalEventDispatcher.emit(event);
  }

  private tick(): void {
    if (this.isPaused) return;

    const currentTime = performance.now();
    this.deltaTime = (currentTime - this.lastFrameTime) / 1000;
    this.lastFrameTime = currentTime;

    // Convert entities to Map format expected by systems
    const entityMap = new Map<EntityId, Entity>();
    this.entityManager.getAllEntities().forEach((entity) => {
      entityMap.set(entity.id, entity);
    });

    // Update systems with events
    for (const system of this.systems) {
      // Emit system update start event
      const startEvent: SystemUpdateStartEvent = {
        type: 'system:update:start',
        systemName: system.name,
        deltaTime: this.deltaTime,
        entityCount: entityMap.size,
        timestamp: Date.now(),
        source: 'GameEngine',
      };
      globalEventDispatcher.emit(startEvent);

      const systemStartTime = performance.now();
      system.update(this.deltaTime, entityMap);
      const systemDuration = performance.now() - systemStartTime;

      // Emit system update end event
      const endEvent: SystemUpdateEndEvent = {
        type: 'system:update:end',
        systemName: system.name,
        deltaTime: this.deltaTime,
        entityCount: entityMap.size,
        duration: systemDuration,
        timestamp: Date.now(),
        source: 'GameEngine',
      };
      globalEventDispatcher.emit(endEvent);
    }

    // Emit engine tick event
    const tickEvent: EngineTickEvent = {
      type: 'engine:tick',
      deltaTime: this.deltaTime,
      fps: 1 / this.deltaTime,
      entityCount: entityMap.size,
      timestamp: Date.now(),
      source: 'GameEngine',
    };
    globalEventDispatcher.emit(tickEvent);
  }

  public getStats() {
    return {
      entityCount: this.entityManager.getEntityCount(),
      systemCount: this.systems.length,
      fps: 1 / this.deltaTime,
      deltaTime: this.deltaTime,
      isRunning: this.isRunning,
      isPaused: this.isPaused,
    } as const;
  }

  public getAllEntities(): Entity[] {
    return this.entityManager.getAllEntities();
  }
}
