import { test, expect } from 'bun:test';
import { PlayerControlSystem } from './PlayerControlSystem';
import {
  createInput,
  createPlayerController,
  createVelocity,
} from '../components';
import type { Entity, EntityId } from '../types';

const createTestEntity = (id: EntityId): Entity => ({
  id,
  components: new Map(),
});

test('PlayerControlSystem moves entity based on input', () => {
  const system = new PlayerControlSystem();
  const entities = new Map<EntityId, Entity>();

  const entity = createTestEntity(1);
  const input = createInput();
  const controller = createPlayerController(100, 400, 300);
  const velocity = createVelocity(0, 0);

  // Set right key pressed
  input.keys.right = true;

  entity.components.set('Input', input);
  entity.components.set('PlayerController', controller);
  entity.components.set('Velocity', velocity);
  entities.set(entity.id, entity);

  system.update(0.5, entities); // Half second update

  // Velocity should increase towards target
  expect(velocity.velocity.x).toBeGreaterThan(0);
  expect(velocity.velocity.y).toBe(0);
});

test('PlayerControlSystem handles diagonal movement', () => {
  const system = new PlayerControlSystem();
  const entities = new Map<EntityId, Entity>();

  const entity = createTestEntity(1);
  const input = createInput();
  const controller = createPlayerController(100, 1000, 500); // Fast accel for testing
  const velocity = createVelocity(0, 0);

  // Set right and up keys pressed
  input.keys.right = true;
  input.keys.up = true;

  entity.components.set('Input', input);
  entity.components.set('PlayerController', controller);
  entity.components.set('Velocity', velocity);
  entities.set(entity.id, entity);

  system.update(1.0, entities);

  // Diagonal movement should be normalized
  const expectedDiagonal = 100 * Math.sqrt(0.5);
  expect(velocity.velocity.x).toBeCloseTo(expectedDiagonal, 1);
  expect(velocity.velocity.y).toBeCloseTo(-expectedDiagonal, 1);
});

test('PlayerControlSystem applies deceleration when no input', () => {
  const system = new PlayerControlSystem();
  const entities = new Map<EntityId, Entity>();

  const entity = createTestEntity(1);
  const input = createInput();
  const controller = createPlayerController(100, 200, 300);
  const velocity = createVelocity(50, 25); // Initial velocity

  // No keys pressed

  entity.components.set('Input', input);
  entity.components.set('PlayerController', controller);
  entity.components.set('Velocity', velocity);
  entities.set(entity.id, entity);

  system.update(0.1, entities);

  // Velocity should decrease towards zero
  expect(Math.abs(velocity.velocity.x)).toBeLessThan(50);
  expect(Math.abs(velocity.velocity.y)).toBeLessThan(25);
});

test('PlayerControlSystem ignores non-controllable entities', () => {
  const system = new PlayerControlSystem();
  const entities = new Map<EntityId, Entity>();

  const entity = createTestEntity(1);
  const input = createInput();
  const controller = createPlayerController();
  const velocity = createVelocity(0, 0);

  input.keys.right = true;
  controller.isControllable = false; // Disable control

  entity.components.set('Input', input);
  entity.components.set('PlayerController', controller);
  entity.components.set('Velocity', velocity);
  entities.set(entity.id, entity);

  system.update(1.0, entities);

  // Velocity should not change
  expect(velocity.velocity.x).toBe(0);
  expect(velocity.velocity.y).toBe(0);
});

test('PlayerControlSystem ignores entities missing components', () => {
  const system = new PlayerControlSystem();
  const entities = new Map<EntityId, Entity>();

  // Entity with only Input component
  const entity1 = createTestEntity(1);
  entity1.components.set('Input', createInput());

  // Entity with only PlayerController
  const entity2 = createTestEntity(2);
  entity2.components.set('PlayerController', createPlayerController());

  entities.set(entity1.id, entity1);
  entities.set(entity2.id, entity2);

  // Should not throw error
  expect(() => system.update(0.016, entities)).not.toThrow();
});

test('PlayerControlSystem handles WASD keys', () => {
  const system = new PlayerControlSystem();
  const entities = new Map<EntityId, Entity>();

  const entity = createTestEntity(1);
  const input = createInput();
  const controller = createPlayerController(100, 1000, 500);
  const velocity = createVelocity(0, 0);

  // Test each direction
  input.keys.up = true; // W key

  entity.components.set('Input', input);
  entity.components.set('PlayerController', controller);
  entity.components.set('Velocity', velocity);
  entities.set(entity.id, entity);

  system.update(1.0, entities);

  expect(velocity.velocity.x).toBe(0);
  expect(velocity.velocity.y).toBeLessThan(0); // Up is negative Y
});

test('PlayerControlSystem acceleration builds up over time', () => {
  const system = new PlayerControlSystem();
  const entities = new Map<EntityId, Entity>();

  const entity = createTestEntity(1);
  const input = createInput();
  const controller = createPlayerController(100, 50, 100); // Slow acceleration
  const velocity = createVelocity(0, 0);

  input.keys.right = true;

  entity.components.set('Input', input);
  entity.components.set('PlayerController', controller);
  entity.components.set('Velocity', velocity);
  entities.set(entity.id, entity);

  // First update
  system.update(0.1, entities);
  const velocity1 = velocity.velocity.x;

  // Second update
  system.update(0.1, entities);
  const velocity2 = velocity.velocity.x;

  // Velocity should increase over time
  expect(velocity2).toBeGreaterThan(velocity1);
  expect(velocity1).toBeGreaterThan(0);
});
