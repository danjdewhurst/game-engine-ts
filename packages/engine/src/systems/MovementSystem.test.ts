import { test, expect } from 'bun:test';
import { MovementSystem } from './MovementSystem';
import { createTransform, createVelocity } from '../components';
import type { Entity, EntityId } from '../types';

const createTestEntity = (id: EntityId): Entity => ({
  id,
  components: new Map(),
});

test('MovementSystem updates entity positions based on velocity', () => {
  const system = new MovementSystem();
  const entities = new Map<EntityId, Entity>();

  const entity = createTestEntity(1);
  entity.components.set('Transform', createTransform(0, 0));
  entity.components.set('Velocity', createVelocity(10, 5));
  entities.set(entity.id, entity);

  system.update(1.0, entities);

  const transform = entity.components.get('Transform') as any;
  expect(transform.position.x).toBe(10);
  expect(transform.position.y).toBe(5);
});

test('MovementSystem handles fractional deltaTime', () => {
  const system = new MovementSystem();
  const entities = new Map<EntityId, Entity>();

  const entity = createTestEntity(1);
  entity.components.set('Transform', createTransform(0, 0));
  entity.components.set('Velocity', createVelocity(20, 10));
  entities.set(entity.id, entity);

  system.update(0.5, entities);

  const transform = entity.components.get('Transform') as any;
  expect(transform.position.x).toBe(10);
  expect(transform.position.y).toBe(5);
});

test('MovementSystem accumulates position over multiple updates', () => {
  const system = new MovementSystem();
  const entities = new Map<EntityId, Entity>();

  const entity = createTestEntity(1);
  entity.components.set('Transform', createTransform(5, 3));
  entity.components.set('Velocity', createVelocity(2, 1));
  entities.set(entity.id, entity);

  system.update(1.0, entities);
  system.update(1.0, entities);

  const transform = entity.components.get('Transform') as any;
  expect(transform.position.x).toBe(9);
  expect(transform.position.y).toBe(5);
});

test('MovementSystem ignores entities without Transform component', () => {
  const system = new MovementSystem();
  const entities = new Map<EntityId, Entity>();

  const entity = createTestEntity(1);
  entity.components.set('Velocity', createVelocity(10, 5));
  entities.set(entity.id, entity);

  // Should not throw error
  expect(() => system.update(1.0, entities)).not.toThrow();
});

test('MovementSystem ignores entities without Velocity component', () => {
  const system = new MovementSystem();
  const entities = new Map<EntityId, Entity>();

  const entity = createTestEntity(1);
  entity.components.set('Transform', createTransform(0, 0));
  entities.set(entity.id, entity);

  system.update(1.0, entities);

  const transform = entity.components.get('Transform') as any;
  expect(transform.position.x).toBe(0);
  expect(transform.position.y).toBe(0);
});

test('MovementSystem enforces max speed constraint', () => {
  const system = new MovementSystem();
  const entities = new Map<EntityId, Entity>();

  const entity = createTestEntity(1);
  entity.components.set('Transform', createTransform(0, 0));
  entity.components.set('Velocity', createVelocity(30, 40, 25)); // Speed = 50, max = 25
  entities.set(entity.id, entity);

  system.update(1.0, entities);

  const velocity = entity.components.get('Velocity') as any;
  const actualSpeed = Math.sqrt(
    velocity.velocity.x ** 2 + velocity.velocity.y ** 2
  );
  expect(actualSpeed).toBeCloseTo(25);

  // Should maintain direction but reduce magnitude
  expect(velocity.velocity.x).toBeCloseTo(15);
  expect(velocity.velocity.y).toBeCloseTo(20);
});

test('MovementSystem does not modify velocity under max speed', () => {
  const system = new MovementSystem();
  const entities = new Map<EntityId, Entity>();

  const entity = createTestEntity(1);
  entity.components.set('Transform', createTransform(0, 0));
  entity.components.set('Velocity', createVelocity(3, 4, 10)); // Speed = 5, max = 10
  entities.set(entity.id, entity);

  system.update(1.0, entities);

  const velocity = entity.components.get('Velocity') as any;
  expect(velocity.velocity.x).toBe(3);
  expect(velocity.velocity.y).toBe(4);
});

test('MovementSystem handles multiple entities', () => {
  const system = new MovementSystem();
  const entities = new Map<EntityId, Entity>();

  const entity1 = createTestEntity(1);
  entity1.components.set('Transform', createTransform(0, 0));
  entity1.components.set('Velocity', createVelocity(1, 2));

  const entity2 = createTestEntity(2);
  entity2.components.set('Transform', createTransform(10, 20));
  entity2.components.set('Velocity', createVelocity(-1, -1));

  entities.set(entity1.id, entity1);
  entities.set(entity2.id, entity2);

  system.update(2.0, entities);

  const transform1 = entity1.components.get('Transform') as any;
  const transform2 = entity2.components.get('Transform') as any;

  expect(transform1.position.x).toBe(2);
  expect(transform1.position.y).toBe(4);

  expect(transform2.position.x).toBe(8);
  expect(transform2.position.y).toBe(18);
});
