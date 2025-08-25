import { test, expect } from 'bun:test';
import { CollisionSystem } from './CollisionSystem';
import {
  createTransform,
  createVelocity,
  createCollider,
  CollisionLayers,
} from '../components';
import type { Entity, EntityId } from '../types';

const createTestEntity = (id: EntityId): Entity => ({
  id,
  components: new Map(),
});

test('CollisionSystem detects collision between two entities', () => {
  const system = new CollisionSystem();
  const entities = new Map<EntityId, Entity>();

  // Create two overlapping entities
  const entityA = createTestEntity(1);
  entityA.components.set('Transform', createTransform(0, 0));
  entityA.components.set(
    'Collider',
    createCollider(20, 20, CollisionLayers.PLAYER)
  );

  const entityB = createTestEntity(2);
  entityB.components.set('Transform', createTransform(10, 10));
  entityB.components.set(
    'Collider',
    createCollider(20, 20, CollisionLayers.ENEMY)
  );

  entities.set(entityA.id, entityA);
  entities.set(entityB.id, entityB);

  system.update(0.016, entities);

  const events = system.getCollisionEvents();
  expect(events).toHaveLength(1);
  expect(events[0].type).toBe('collision');
  expect(events[0].entityA).toBe(1);
  expect(events[0].entityB).toBe(2);
});

test('CollisionSystem ignores non-colliding layers', () => {
  const system = new CollisionSystem();
  const entities = new Map<EntityId, Entity>();

  // Player and projectile shouldn't collide
  const entityA = createTestEntity(1);
  entityA.components.set('Transform', createTransform(0, 0));
  entityA.components.set(
    'Collider',
    createCollider(20, 20, CollisionLayers.PLAYER)
  );

  const entityB = createTestEntity(2);
  entityB.components.set('Transform', createTransform(5, 5));
  entityB.components.set(
    'Collider',
    createCollider(20, 20, CollisionLayers.PROJECTILE)
  );

  entities.set(entityA.id, entityA);
  entities.set(entityB.id, entityB);

  system.update(0.016, entities);

  const events = system.getCollisionEvents();
  expect(events).toHaveLength(0);
});

test('CollisionSystem detects trigger events', () => {
  const system = new CollisionSystem();
  const entities = new Map<EntityId, Entity>();

  // Create trigger collision
  const entityA = createTestEntity(1);
  entityA.components.set('Transform', createTransform(0, 0));
  entityA.components.set(
    'Collider',
    createCollider(20, 20, CollisionLayers.PLAYER)
  );

  const trigger = createCollider(30, 30, CollisionLayers.TRIGGER, {
    isTrigger: true,
  });
  const entityB = createTestEntity(2);
  entityB.components.set('Transform', createTransform(10, 10));
  entityB.components.set('Collider', trigger);

  entities.set(entityA.id, entityA);
  entities.set(entityB.id, entityB);

  system.update(0.016, entities);

  const events = system.getCollisionEvents();
  expect(events).toHaveLength(1);
  expect(events[0].type).toBe('trigger');
});

test('CollisionSystem resolves physical collision with velocity', () => {
  const system = new CollisionSystem();
  const entities = new Map<EntityId, Entity>();

  // Create two entities with velocity moving towards each other
  const entityA = createTestEntity(1);
  entityA.components.set('Transform', createTransform(0, 0));
  entityA.components.set('Velocity', createVelocity(10, 0));
  entityA.components.set(
    'Collider',
    createCollider(20, 20, CollisionLayers.PLAYER)
  );

  const entityB = createTestEntity(2);
  entityB.components.set('Transform', createTransform(15, 0));
  entityB.components.set('Velocity', createVelocity(-5, 0));
  entityB.components.set(
    'Collider',
    createCollider(20, 20, CollisionLayers.ENEMY)
  );

  entities.set(entityA.id, entityA);
  entities.set(entityB.id, entityB);

  const velocityA = entityA.components.get('Velocity') as any;
  const velocityB = entityB.components.get('Velocity') as any;
  const initialVelA = velocityA.velocity.x;
  const initialVelB = velocityB.velocity.x;

  system.update(0.016, entities);

  // Velocities should change after collision
  expect(velocityA.velocity.x).not.toBe(initialVelA);
  expect(velocityB.velocity.x).not.toBe(initialVelB);

  // Entities should be separated to prevent overlap
  const transformA = entityA.components.get('Transform') as any;
  const transformB = entityB.components.get('Transform') as any;
  expect(transformA.position.x).not.toBe(0);
  expect(transformB.position.x).not.toBe(15);
});

test('CollisionSystem handles static colliders correctly', () => {
  const system = new CollisionSystem();
  const entities = new Map<EntityId, Entity>();

  // Moving entity hits static wall
  const entityA = createTestEntity(1);
  entityA.components.set('Transform', createTransform(0, 0));
  entityA.components.set('Velocity', createVelocity(10, 0));
  entityA.components.set(
    'Collider',
    createCollider(20, 20, CollisionLayers.PLAYER)
  );

  const wall = createCollider(20, 100, CollisionLayers.WALL, {
    isStatic: true,
  });
  const entityB = createTestEntity(2);
  entityB.components.set('Transform', createTransform(15, 0));
  entityB.components.set('Collider', wall);

  entities.set(entityA.id, entityA);
  entities.set(entityB.id, entityB);

  const transformB = entityB.components.get('Transform') as any;
  const initialPosB = { x: transformB.position.x, y: transformB.position.y };

  system.update(0.016, entities);

  // Static entity should not move
  expect(transformB.position.x).toBe(initialPosB.x);
  expect(transformB.position.y).toBe(initialPosB.y);

  // Moving entity should bounce back
  const velocityA = entityA.components.get('Velocity') as any;
  expect(velocityA.velocity.x).toBeLessThan(0);
});

test('CollisionSystem event listeners work correctly', () => {
  const system = new CollisionSystem();
  const entities = new Map<EntityId, Entity>();

  let collisionEventReceived = false;
  let triggerEventReceived = false;

  system.addEventListener('collision', () => {
    collisionEventReceived = true;
  });

  system.addEventListener('trigger', () => {
    triggerEventReceived = true;
  });

  // Create collision
  const entityA = createTestEntity(1);
  entityA.components.set('Transform', createTransform(0, 0));
  entityA.components.set(
    'Collider',
    createCollider(20, 20, CollisionLayers.PLAYER)
  );

  const entityB = createTestEntity(2);
  entityB.components.set('Transform', createTransform(10, 10));
  entityB.components.set(
    'Collider',
    createCollider(20, 20, CollisionLayers.ENEMY)
  );

  entities.set(entityA.id, entityA);
  entities.set(entityB.id, entityB);

  system.update(0.016, entities);

  expect(collisionEventReceived).toBe(true);
  expect(triggerEventReceived).toBe(false);
});

test('CollisionSystem getEntitiesInBounds works correctly', () => {
  const system = new CollisionSystem();
  const entities = new Map<EntityId, Entity>();

  // Create entities at different positions
  const entityA = createTestEntity(1);
  entityA.components.set('Transform', createTransform(0, 0));
  entityA.components.set(
    'Collider',
    createCollider(20, 20, CollisionLayers.PLAYER)
  );

  const entityB = createTestEntity(2);
  entityB.components.set('Transform', createTransform(50, 50));
  entityB.components.set(
    'Collider',
    createCollider(20, 20, CollisionLayers.ENEMY)
  );

  const entityC = createTestEntity(3);
  entityC.components.set('Transform', createTransform(10, 10));
  entityC.components.set(
    'Collider',
    createCollider(20, 20, CollisionLayers.PICKUP)
  );

  entities.set(entityA.id, entityA);
  entities.set(entityB.id, entityB);
  entities.set(entityC.id, entityC);

  // Update to set bounding boxes
  system.update(0.016, entities);

  // Query area that should contain entityA and entityC
  const entitiesInBounds = system.getEntitiesInBounds(
    { x: -10, y: -10, width: 40, height: 40 },
    entities
  );

  expect(entitiesInBounds).toHaveLength(2);
  expect(entitiesInBounds.map((e) => e.id)).toContain(1);
  expect(entitiesInBounds.map((e) => e.id)).toContain(3);
  expect(entitiesInBounds.map((e) => e.id)).not.toContain(2);
});

test('CollisionSystem getEntitiesAtPoint works correctly', () => {
  const system = new CollisionSystem();
  const entities = new Map<EntityId, Entity>();

  const entityA = createTestEntity(1);
  entityA.components.set('Transform', createTransform(20, 20));
  entityA.components.set(
    'Collider',
    createCollider(40, 40, CollisionLayers.PLAYER)
  );

  entities.set(entityA.id, entityA);

  system.update(0.016, entities);

  // Point inside the entity
  const entitiesAtPoint = system.getEntitiesAtPoint({ x: 25, y: 25 }, entities);
  expect(entitiesAtPoint).toHaveLength(1);
  expect(entitiesAtPoint[0].id).toBe(1);

  // Point outside the entity
  const entitiesAtPointOutside = system.getEntitiesAtPoint(
    { x: 100, y: 100 },
    entities
  );
  expect(entitiesAtPointOutside).toHaveLength(0);
});

test('CollisionSystem ignores entities without Transform', () => {
  const system = new CollisionSystem();
  const entities = new Map<EntityId, Entity>();

  // Entity with Collider but no Transform
  const entityA = createTestEntity(1);
  entityA.components.set(
    'Collider',
    createCollider(20, 20, CollisionLayers.PLAYER)
  );

  entities.set(entityA.id, entityA);

  system.update(0.016, entities);

  const events = system.getCollisionEvents();
  expect(events).toHaveLength(0);
});
