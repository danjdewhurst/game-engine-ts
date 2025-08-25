import type { System, Entity, EntityId } from '../types';
import type { TransformComponent } from '../components/Transform';
import type { VelocityComponent } from '../components/Velocity';
import type {
  ColliderComponent,
  Collision,
  CollisionEvent,
  CollisionLayer,
} from '../components/Collider';
import { canLayersCollide } from '../components/Collider';
import {
  checkAABBCollision,
  getCollisionInfo,
  updateBoundingBox,
  resolveCollision,
} from '../utils/collision';
import { globalEventDispatcher } from '../events/EventDispatcher';
import type {
  CollisionDetectedEvent,
  TriggerActivatedEvent,
} from '../events/EventDispatcher';

export class CollisionSystem implements System {
  public readonly name = 'CollisionSystem';
  private collisionEvents: CollisionEvent[] = [];
  private eventListeners: Map<string, Array<(event: CollisionEvent) => void>> =
    new Map();

  public update(deltaTime: number, entities: Map<EntityId, Entity>): void {
    this.collisionEvents = [];

    // Get all entities with colliders
    const collidableEntities = Array.from(entities.values()).filter(
      (entity) =>
        entity.components.has('Collider') && entity.components.has('Transform')
    );

    // Update bounding boxes based on current positions
    this.updateBoundingBoxes(collidableEntities);

    // Check for collisions between all pairs
    for (let i = 0; i < collidableEntities.length; i++) {
      for (let j = i + 1; j < collidableEntities.length; j++) {
        this.checkEntityPair(collidableEntities[i], collidableEntities[j]);
      }
    }

    // Process collision events
    this.processCollisionEvents();
  }

  private updateBoundingBoxes(entities: Entity[]): void {
    for (const entity of entities) {
      const transform = entity.components.get(
        'Transform'
      ) as TransformComponent;
      const collider = entity.components.get('Collider') as ColliderComponent;

      updateBoundingBox(collider.boundingBox, transform.position, {
        x: collider.boundingBox.width,
        y: collider.boundingBox.height,
      });
    }
  }

  private checkEntityPair(entityA: Entity, entityB: Entity): void {
    const colliderA = entityA.components.get('Collider') as ColliderComponent;
    const colliderB = entityB.components.get('Collider') as ColliderComponent;

    // Check if layers can collide
    if (!canLayersCollide(colliderA.layer, colliderB.layer)) {
      return;
    }

    // Check for collision
    const collision = getCollisionInfo(
      entityA.id,
      entityB.id,
      colliderA.boundingBox,
      colliderB.boundingBox
    );

    if (!collision) {
      return;
    }

    // Create collision event
    const eventType =
      colliderA.isTrigger || colliderB.isTrigger ? 'trigger' : 'collision';
    const collisionEvent: CollisionEvent = {
      type: eventType,
      collision,
      entityA: entityA.id,
      entityB: entityB.id,
    };

    this.collisionEvents.push(collisionEvent);

    // Emit event through central event system
    if (eventType === 'trigger') {
      const triggerEvent: TriggerActivatedEvent = {
        type: 'trigger:activated',
        entityA: entityA.id,
        entityB: entityB.id,
        collision,
        timestamp: Date.now(),
        source: 'CollisionSystem',
      };
      globalEventDispatcher.emit(triggerEvent);
    } else {
      const collisionDetectedEvent: CollisionDetectedEvent = {
        type: 'collision:detected',
        entityA: entityA.id,
        entityB: entityB.id,
        collision,
        timestamp: Date.now(),
        source: 'CollisionSystem',
      };
      globalEventDispatcher.emit(collisionDetectedEvent);

      // Resolve the collision physically
      this.resolvePhysicalCollision(entityA, entityB, collision);
    }
  }

  private resolvePhysicalCollision(
    entityA: Entity,
    entityB: Entity,
    collision: Collision
  ): void {
    const transformA = entityA.components.get(
      'Transform'
    ) as TransformComponent;
    const transformB = entityB.components.get(
      'Transform'
    ) as TransformComponent;
    const velocityA = entityA.components.get('Velocity') as
      | VelocityComponent
      | undefined;
    const velocityB = entityB.components.get('Velocity') as
      | VelocityComponent
      | undefined;
    const colliderA = entityA.components.get('Collider') as ColliderComponent;
    const colliderB = entityB.components.get('Collider') as ColliderComponent;

    // Get current velocities (default to zero if no velocity component)
    const velA = velocityA ? velocityA.velocity : { x: 0, y: 0 };
    const velB = velocityB ? velocityB.velocity : { x: 0, y: 0 };

    // Resolve collision
    const resolution = resolveCollision(
      collision,
      colliderA.mass,
      colliderB.mass,
      colliderA.restitution,
      colliderB.restitution,
      velA,
      velB,
      colliderA.isStatic,
      colliderB.isStatic
    );

    // Apply new velocities
    if (velocityA && !colliderA.isStatic) {
      velocityA.velocity = resolution.newVelocityA;
    }

    if (velocityB && !colliderB.isStatic) {
      velocityB.velocity = resolution.newVelocityB;
    }

    // Apply position separation to prevent overlap
    if (!colliderA.isStatic) {
      transformA.position.x += resolution.separationA.x;
      transformA.position.y += resolution.separationA.y;
    }

    if (!colliderB.isStatic) {
      transformB.position.x += resolution.separationB.x;
      transformB.position.y += resolution.separationB.y;
    }
  }

  private processCollisionEvents(): void {
    for (const event of this.collisionEvents) {
      this.emitCollisionEvent(event);
    }
  }

  public addEventListener(
    eventType: string,
    listener: (event: CollisionEvent) => void
  ): void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }
    this.eventListeners.get(eventType)!.push(listener);
  }

  public removeEventListener(
    eventType: string,
    listener: (event: CollisionEvent) => void
  ): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emitCollisionEvent(event: CollisionEvent): void {
    const listeners = this.eventListeners.get(event.type) || [];
    for (const listener of listeners) {
      listener(event);
    }
  }

  public getCollisionEvents(): CollisionEvent[] {
    return [...this.collisionEvents];
  }

  public clearEvents(): void {
    this.collisionEvents = [];
  }

  // Utility methods for querying collisions
  public getEntitiesInBounds(
    bounds: { x: number; y: number; width: number; height: number },
    entities: Map<EntityId, Entity>,
    layer?: CollisionLayer
  ): Entity[] {
    const results: Entity[] = [];

    for (const entity of entities.values()) {
      const collider = entity.components.get('Collider') as
        | ColliderComponent
        | undefined;
      if (!collider) continue;

      if (layer !== undefined && collider.layer !== layer) continue;

      if (checkAABBCollision(bounds, collider.boundingBox)) {
        results.push(entity);
      }
    }

    return results;
  }

  public getEntitiesAtPoint(
    point: { x: number; y: number },
    entities: Map<EntityId, Entity>,
    layer?: CollisionLayer
  ): Entity[] {
    return this.getEntitiesInBounds(
      { x: point.x, y: point.y, width: 1, height: 1 },
      entities,
      layer
    );
  }
}
