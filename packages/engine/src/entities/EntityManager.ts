import type { Entity, EntityId, Component } from '../types';
import { globalEventDispatcher } from '../events/EventDispatcher';
import type {
  EntityCreatedEvent,
  EntityDestroyedEvent,
  ComponentAddedEvent,
  ComponentRemovedEvent,
} from '../events/EventDispatcher';

export class EntityManager {
  private entities = new Map<EntityId, Entity>();
  private nextEntityId: EntityId = 1;
  private readonly maxEntities: number;

  constructor(maxEntities = 10000) {
    this.maxEntities = maxEntities;
  }

  public createEntity(): Entity {
    if (this.entities.size >= this.maxEntities) {
      throw new Error(
        `Cannot create entity: maximum entities (${this.maxEntities}) reached`
      );
    }

    const entity: Entity = {
      id: this.nextEntityId++,
      components: new Map(),
    };

    this.entities.set(entity.id, entity);

    // Emit entity created event
    const event: EntityCreatedEvent = {
      type: 'entity:created',
      entityId: entity.id,
      timestamp: Date.now(),
      source: 'EntityManager',
    };
    globalEventDispatcher.emit(event);

    return entity;
  }

  public getEntity(id: EntityId): Entity | undefined {
    return this.entities.get(id);
  }

  public getAllEntities(): Entity[] {
    return Array.from(this.entities.values());
  }

  public destroyEntity(id: EntityId): void {
    const entity = this.entities.get(id);
    if (entity) {
      this.entities.delete(id);

      // Emit entity destroyed event
      const event: EntityDestroyedEvent = {
        type: 'entity:destroyed',
        entityId: id,
        timestamp: Date.now(),
        source: 'EntityManager',
      };
      globalEventDispatcher.emit(event);
    }
  }

  public addComponent<T extends Component>(
    entityId: EntityId,
    component: T
  ): void {
    const entity = this.entities.get(entityId);
    if (!entity) {
      throw new Error(`Entity ${entityId} not found`);
    }

    entity.components.set(component.type, component);

    // Emit component added event
    const event: ComponentAddedEvent = {
      type: 'component:added',
      entityId,
      component,
      timestamp: Date.now(),
      source: 'EntityManager',
    };
    globalEventDispatcher.emit(event);
  }

  public removeComponent(entityId: EntityId, componentType: string): void {
    const entity = this.entities.get(entityId);
    if (!entity) {
      throw new Error(`Entity ${entityId} not found`);
    }

    const hadComponent = entity.components.has(componentType);
    entity.components.delete(componentType);

    // Emit component removed event only if component was actually removed
    if (hadComponent) {
      const event: ComponentRemovedEvent = {
        type: 'component:removed',
        entityId,
        componentType,
        timestamp: Date.now(),
        source: 'EntityManager',
      };
      globalEventDispatcher.emit(event);
    }
  }

  public getComponent<T extends Component>(
    entityId: EntityId,
    componentType: string
  ): T | undefined {
    const entity = this.entities.get(entityId);
    if (!entity) return undefined;

    return entity.components.get(componentType) as T;
  }

  public hasComponent(entityId: EntityId, componentType: string): boolean {
    const entity = this.entities.get(entityId);
    if (!entity) return false;

    return entity.components.has(componentType);
  }

  public getEntitiesWithComponent(componentType: string): Entity[] {
    return this.getAllEntities().filter((entity) =>
      entity.components.has(componentType)
    );
  }

  public getEntitiesWithComponents(componentTypes: string[]): Entity[] {
    return this.getAllEntities().filter((entity) =>
      componentTypes.every((type) => entity.components.has(type))
    );
  }

  public getEntityCount(): number {
    return this.entities.size;
  }

  public clear(): void {
    this.entities.clear();
    this.nextEntityId = 1;
  }
}
