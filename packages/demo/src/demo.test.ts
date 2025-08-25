import { test, expect } from 'bun:test';
import { createDemoGame } from './index';

test('createDemoGame creates engine with entities and systems', () => {
  const { engine, entities } = createDemoGame();

  expect(entities).toHaveLength(5);

  const stats = engine.getStats();
  expect(stats.entityCount).toBe(5);
  expect(stats.systemCount).toBe(1);
});

test('demo entities have required components', () => {
  const { engine, entities } = createDemoGame();

  entities.forEach((entityId) => {
    expect(engine.hasComponent(entityId, 'Transform')).toBe(true);
    expect(engine.hasComponent(entityId, 'Velocity')).toBe(true);

    const transform = engine.getComponent(entityId, 'Transform');
    const velocity = engine.getComponent(entityId, 'Velocity');

    expect(transform).toBeDefined();
    expect(velocity).toBeDefined();
  });
});

test('demo entities have different starting positions and velocities', () => {
  const { engine, entities } = createDemoGame();

  const transforms = entities.map(
    (id) => engine.getComponent(id, 'Transform') as any
  );
  const velocities = entities.map(
    (id) => engine.getComponent(id, 'Velocity') as any
  );

  // Check that positions are different
  const positions = transforms.map((t) => `${t.position.x},${t.position.y}`);
  const uniquePositions = new Set(positions);
  expect(uniquePositions.size).toBe(entities.length);

  // Check that velocities are different
  const vels = velocities.map((v) => `${v.velocity.x},${v.velocity.y}`);
  const uniqueVelocities = new Set(vels);
  expect(uniqueVelocities.size).toBe(entities.length);
});

test('demo entities move when engine runs', async () => {
  const { engine, entities } = createDemoGame();

  // Record initial positions
  const initialPositions = entities.map((id) => {
    const transform = engine.getComponent(id, 'Transform') as any;
    return { x: transform.position.x, y: transform.position.y };
  });

  engine.start();
  await new Promise((resolve) => setTimeout(resolve, 100)); // Let it run briefly
  engine.stop();

  // Check that positions have changed
  entities.forEach((id, index) => {
    const transform = engine.getComponent(id, 'Transform') as any;
    const initial = initialPositions[index];

    expect(transform.position.x).not.toBe(initial.x);
    expect(transform.position.y).not.toBe(initial.y);
  });
});
