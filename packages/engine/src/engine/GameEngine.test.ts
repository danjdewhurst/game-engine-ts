import { test, expect } from 'bun:test';
import { GameEngine } from './GameEngine';
import { MovementSystem } from '../systems';
import { createTransform, createVelocity } from '../components';
import type { System, EntityId, Entity } from '../types';

// Mock system for testing
class TestSystem implements System {
  public readonly name = 'TestSystem';
  public updateCallCount = 0;
  public lastDeltaTime = 0;
  public lastEntityCount = 0;

  public update(deltaTime: number, entities: Map<EntityId, Entity>): void {
    this.updateCallCount++;
    this.lastDeltaTime = deltaTime;
    this.lastEntityCount = entities.size;
  }
}

test('GameEngine initializes with default options', () => {
  const engine = new GameEngine();

  expect(engine.isRunning).toBe(false);
  expect(engine.isPaused).toBe(false);

  const stats = engine.getStats();
  expect(stats.entityCount).toBe(0);
  expect(stats.systemCount).toBe(0);
});

test('GameEngine initializes with custom options', () => {
  const engine = new GameEngine({ targetFPS: 30, maxEntities: 100 });

  const stats = engine.getStats();
  expect(stats.entityCount).toBe(0);
  expect(stats.systemCount).toBe(0);
});

test('GameEngine can add and remove systems', () => {
  const engine = new GameEngine();
  const system = new TestSystem();

  engine.addSystem(system);
  expect(engine.getStats().systemCount).toBe(1);

  engine.removeSystem('TestSystem');
  expect(engine.getStats().systemCount).toBe(0);
});

test('GameEngine can create entities', () => {
  const engine = new GameEngine();

  const entity = engine.createEntity();
  expect(entity.id).toBe(1);
  expect(engine.getStats().entityCount).toBe(1);

  const entity2 = engine.createEntity();
  expect(entity2.id).toBe(2);
  expect(engine.getStats().entityCount).toBe(2);
});

test('GameEngine can retrieve entities', () => {
  const engine = new GameEngine();

  const entity = engine.createEntity();
  const retrieved = engine.getEntity(entity.id);

  expect(retrieved).toBeDefined();
  expect(retrieved?.id).toBe(entity.id);
});

test('GameEngine can destroy entities', () => {
  const engine = new GameEngine();

  const entity = engine.createEntity();
  expect(engine.getStats().entityCount).toBe(1);

  engine.destroyEntity(entity.id);
  expect(engine.getStats().entityCount).toBe(0);
});

test('GameEngine can manage components', () => {
  const engine = new GameEngine();

  const entity = engine.createEntity();
  const transform = createTransform(10, 20);

  engine.addComponent(entity.id, transform);
  expect(engine.hasComponent(entity.id, 'Transform')).toBe(true);

  const retrieved = engine.getComponent(entity.id, 'Transform');
  expect(retrieved).toBeDefined();
  expect((retrieved as any).position.x).toBe(10);

  engine.removeComponent(entity.id, 'Transform');
  expect(engine.hasComponent(entity.id, 'Transform')).toBe(false);
});

test('GameEngine can find entities with components', () => {
  const engine = new GameEngine();

  const entity1 = engine.createEntity();
  const entity2 = engine.createEntity();

  engine.addComponent(entity1.id, createTransform());
  engine.addComponent(entity2.id, createVelocity());

  const withTransform = engine.getEntitiesWithComponent('Transform');
  expect(withTransform).toHaveLength(1);
  expect(withTransform[0].id).toBe(entity1.id);

  const withVelocity = engine.getEntitiesWithComponent('Velocity');
  expect(withVelocity).toHaveLength(1);
  expect(withVelocity[0].id).toBe(entity2.id);
});

test('GameEngine can find entities with multiple components', () => {
  const engine = new GameEngine();

  const entity1 = engine.createEntity();
  const entity2 = engine.createEntity();

  engine.addComponent(entity1.id, createTransform());
  engine.addComponent(entity1.id, createVelocity());
  engine.addComponent(entity2.id, createTransform());

  const withBoth = engine.getEntitiesWithComponents(['Transform', 'Velocity']);
  expect(withBoth).toHaveLength(1);
  expect(withBoth[0].id).toBe(entity1.id);
});

test('GameEngine start/stop lifecycle', () => {
  const engine = new GameEngine();

  expect(engine.isRunning).toBe(false);

  engine.start();
  expect(engine.isRunning).toBe(true);
  expect(engine.isPaused).toBe(false);

  engine.stop();
  expect(engine.isRunning).toBe(false);
});

test('GameEngine pause/resume lifecycle', () => {
  const engine = new GameEngine();

  engine.start();
  expect(engine.isPaused).toBe(false);

  engine.pause();
  expect(engine.isRunning).toBe(true);
  expect(engine.isPaused).toBe(true);

  engine.resume();
  expect(engine.isRunning).toBe(true);
  expect(engine.isPaused).toBe(false);

  engine.stop();
});

test('GameEngine calls systems during game loop', async () => {
  const engine = new GameEngine({ targetFPS: 1000 }); // Fast for testing
  const system = new TestSystem();

  engine.addSystem(system);
  engine.start();

  // Wait a bit for tick to occur
  await new Promise((resolve) => setTimeout(resolve, 10));

  engine.stop();

  expect(system.updateCallCount).toBeGreaterThan(0);
  expect(system.lastDeltaTime).toBeGreaterThan(0);
});

test('GameEngine integration with MovementSystem', async () => {
  const engine = new GameEngine({ targetFPS: 1000 });
  engine.addSystem(new MovementSystem());

  const entity = engine.createEntity();
  engine.addComponent(entity.id, createTransform(0, 0));
  engine.addComponent(entity.id, createVelocity(100, 50)); // Fast for testing

  engine.start();
  await new Promise((resolve) => setTimeout(resolve, 50)); // Let it run briefly
  engine.stop();

  const transform = engine.getComponent(entity.id, 'Transform');
  expect((transform as any).position.x).toBeGreaterThan(0);
  expect((transform as any).position.y).toBeGreaterThan(0);
});

test('GameEngine stats provide accurate information', () => {
  const engine = new GameEngine();
  const system = new TestSystem();

  engine.addSystem(system);
  const entity = engine.createEntity();

  const stats = engine.getStats();
  expect(stats.entityCount).toBe(1);
  expect(stats.systemCount).toBe(1);
  expect(stats.isRunning).toBe(false);
  expect(stats.isPaused).toBe(false);
  expect(typeof stats.fps).toBe('number');
  expect(typeof stats.deltaTime).toBe('number');
});
