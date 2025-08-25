import { test, expect } from 'bun:test';
import { RenderSystem } from './RenderSystem';
import { createTransform, createRenderable } from '../components';
import type { Entity, EntityId } from '../types';

const createTestEntity = (id: EntityId): Entity => ({
  id,
  components: new Map(),
});

test('RenderSystem generates game state with entities', () => {
  const system = new RenderSystem();
  const entities = new Map<EntityId, Entity>();

  const entity = createTestEntity(1);
  entity.components.set('Transform', createTransform(100, 200, 0.5, 2, 3));
  entity.components.set(
    'Renderable',
    createRenderable('circle', 25, 25, '#ff0000')
  );
  entities.set(entity.id, entity);

  system.update(0.016, entities);

  const gameState = system.getGameState();
  expect(gameState).toBeDefined();
  expect(gameState!.entities).toHaveLength(1);

  const renderedEntity = gameState!.entities[0];
  expect(renderedEntity.id).toBe(1);
  expect(renderedEntity.position.x).toBe(100);
  expect(renderedEntity.position.y).toBe(200);
  expect(renderedEntity.rotation).toBe(0.5);
  expect(renderedEntity.scale.x).toBe(2);
  expect(renderedEntity.scale.y).toBe(3);
  expect(renderedEntity.renderable).toBeDefined();
  expect(renderedEntity.renderable!.shape).toBe('circle');
  expect(renderedEntity.renderable!.color).toBe('#ff0000');
});

test('RenderSystem ignores entities without Transform', () => {
  const system = new RenderSystem();
  const entities = new Map<EntityId, Entity>();

  const entity = createTestEntity(1);
  entity.components.set('Renderable', createRenderable());
  entities.set(entity.id, entity);

  system.update(0.016, entities);

  const gameState = system.getGameState();
  expect(gameState!.entities).toHaveLength(0);
});

test('RenderSystem includes entities without Renderable component', () => {
  const system = new RenderSystem();
  const entities = new Map<EntityId, Entity>();

  const entity = createTestEntity(1);
  entity.components.set('Transform', createTransform(50, 75));
  entities.set(entity.id, entity);

  system.update(0.016, entities);

  const gameState = system.getGameState();
  expect(gameState!.entities).toHaveLength(1);

  const renderedEntity = gameState!.entities[0];
  expect(renderedEntity.renderable).toBeUndefined();
});

test('RenderSystem ignores invisible entities', () => {
  const system = new RenderSystem();
  const entities = new Map<EntityId, Entity>();

  const entity = createTestEntity(1);
  entity.components.set('Transform', createTransform(100, 100));

  const renderable = createRenderable();
  renderable.visible = false;
  entity.components.set('Renderable', renderable);

  entities.set(entity.id, entity);

  system.update(0.016, entities);

  const gameState = system.getGameState();
  expect(gameState!.entities).toHaveLength(1);
  expect(gameState!.entities[0].renderable).toBeUndefined();
});

test('RenderSystem sorts entities by layer', () => {
  const system = new RenderSystem();
  const entities = new Map<EntityId, Entity>();

  // Create entities with different layers
  const entity1 = createTestEntity(1);
  entity1.components.set('Transform', createTransform(0, 0));
  entity1.components.set(
    'Renderable',
    createRenderable('rectangle', 20, 20, '#red', 1, 5)
  );

  const entity2 = createTestEntity(2);
  entity2.components.set('Transform', createTransform(10, 10));
  entity2.components.set(
    'Renderable',
    createRenderable('circle', 15, 15, '#blue', 1, 1)
  );

  const entity3 = createTestEntity(3);
  entity3.components.set('Transform', createTransform(20, 20));
  entity3.components.set(
    'Renderable',
    createRenderable('rectangle', 25, 25, '#green', 1, 3)
  );

  entities.set(entity1.id, entity1);
  entities.set(entity2.id, entity2);
  entities.set(entity3.id, entity3);

  system.update(0.016, entities);

  const gameState = system.getGameState();
  expect(gameState!.entities).toHaveLength(3);

  // Should be sorted by layer: 1, 3, 5
  expect(gameState!.entities[0].id).toBe(2); // layer 1
  expect(gameState!.entities[1].id).toBe(3); // layer 3
  expect(gameState!.entities[2].id).toBe(1); // layer 5
});

test('RenderSystem includes stats in game state', () => {
  const system = new RenderSystem();
  const entities = new Map<EntityId, Entity>();

  const entity = createTestEntity(1);
  entity.components.set('Transform', createTransform());
  entities.set(entity.id, entity);

  const deltaTime = 0.016;
  system.update(deltaTime, entities);

  const gameState = system.getGameState();
  expect(gameState!.stats).toBeDefined();
  expect(gameState!.stats.fps).toBeCloseTo(1 / deltaTime);
  expect(gameState!.stats.entityCount).toBe(1);
  expect(gameState!.stats.deltaTime).toBe(deltaTime);
  expect(gameState!.timestamp).toBeGreaterThan(0);
});

test('RenderSystem handles multiple entities', () => {
  const system = new RenderSystem();
  const entities = new Map<EntityId, Entity>();

  // Create multiple entities
  for (let i = 1; i <= 5; i++) {
    const entity = createTestEntity(i);
    entity.components.set('Transform', createTransform(i * 10, i * 20));
    entity.components.set(
      'Renderable',
      createRenderable('rectangle', 10, 10, `hsl(${i * 60}, 100%, 50%)`)
    );
    entities.set(entity.id, entity);
  }

  system.update(0.016, entities);

  const gameState = system.getGameState();
  expect(gameState!.entities).toHaveLength(5);
  expect(gameState!.stats.entityCount).toBe(5);

  // Check that all entities have correct data
  gameState!.entities.forEach((entity, index) => {
    const expectedId = index + 1;
    expect(entity.id).toBe(expectedId);
    expect(entity.position.x).toBe(expectedId * 10);
    expect(entity.position.y).toBe(expectedId * 20);
    expect(entity.renderable).toBeDefined();
  });
});
