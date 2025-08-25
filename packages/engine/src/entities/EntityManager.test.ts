import { test, expect } from 'bun:test';
import { EntityManager } from './EntityManager';
import { createTransform, createVelocity } from '../components';

test('EntityManager creates entities with unique IDs', () => {
  const manager = new EntityManager();

  const entity1 = manager.createEntity();
  const entity2 = manager.createEntity();

  expect(entity1.id).toBe(1);
  expect(entity2.id).toBe(2);
  expect(entity1.id).not.toBe(entity2.id);
});

test('EntityManager tracks entity count', () => {
  const manager = new EntityManager();

  expect(manager.getEntityCount()).toBe(0);

  manager.createEntity();
  expect(manager.getEntityCount()).toBe(1);

  manager.createEntity();
  expect(manager.getEntityCount()).toBe(2);
});

test('EntityManager enforces maximum entity limit', () => {
  const manager = new EntityManager(2);

  manager.createEntity();
  manager.createEntity();

  expect(() => manager.createEntity()).toThrow('maximum entities (2) reached');
});

test('EntityManager can retrieve entities by ID', () => {
  const manager = new EntityManager();

  const entity = manager.createEntity();
  const retrieved = manager.getEntity(entity.id);

  expect(retrieved).toBeDefined();
  expect(retrieved?.id).toBe(entity.id);
});

test('EntityManager returns undefined for non-existent entities', () => {
  const manager = new EntityManager();

  const retrieved = manager.getEntity(999);
  expect(retrieved).toBeUndefined();
});

test('EntityManager can destroy entities', () => {
  const manager = new EntityManager();

  const entity = manager.createEntity();
  expect(manager.getEntityCount()).toBe(1);

  manager.destroyEntity(entity.id);
  expect(manager.getEntityCount()).toBe(0);
  expect(manager.getEntity(entity.id)).toBeUndefined();
});

test('EntityManager can add components to entities', () => {
  const manager = new EntityManager();

  const entity = manager.createEntity();
  const transform = createTransform(10, 20);

  manager.addComponent(entity.id, transform);

  expect(manager.hasComponent(entity.id, 'Transform')).toBe(true);
  const retrieved = manager.getComponent(entity.id, 'Transform');
  expect(retrieved).toBeDefined();
  expect((retrieved as any).position.x).toBe(10);
  expect((retrieved as any).position.y).toBe(20);
});

test('EntityManager throws error when adding component to non-existent entity', () => {
  const manager = new EntityManager();
  const transform = createTransform();

  expect(() => manager.addComponent(999, transform)).toThrow(
    'Entity 999 not found'
  );
});

test('EntityManager can remove components', () => {
  const manager = new EntityManager();

  const entity = manager.createEntity();
  manager.addComponent(entity.id, createTransform());

  expect(manager.hasComponent(entity.id, 'Transform')).toBe(true);

  manager.removeComponent(entity.id, 'Transform');

  expect(manager.hasComponent(entity.id, 'Transform')).toBe(false);
  expect(manager.getComponent(entity.id, 'Transform')).toBeUndefined();
});

test('EntityManager can find entities with specific component', () => {
  const manager = new EntityManager();

  const entity1 = manager.createEntity();
  const entity2 = manager.createEntity();
  const entity3 = manager.createEntity();

  manager.addComponent(entity1.id, createTransform());
  manager.addComponent(entity2.id, createVelocity());
  manager.addComponent(entity3.id, createTransform());

  const withTransform = manager.getEntitiesWithComponent('Transform');
  expect(withTransform).toHaveLength(2);
  expect(withTransform.map((e) => e.id)).toContain(entity1.id);
  expect(withTransform.map((e) => e.id)).toContain(entity3.id);
});

test('EntityManager can find entities with multiple components', () => {
  const manager = new EntityManager();

  const entity1 = manager.createEntity();
  const entity2 = manager.createEntity();
  const entity3 = manager.createEntity();

  manager.addComponent(entity1.id, createTransform());
  manager.addComponent(entity1.id, createVelocity());

  manager.addComponent(entity2.id, createTransform());

  manager.addComponent(entity3.id, createVelocity());

  const withBoth = manager.getEntitiesWithComponents(['Transform', 'Velocity']);
  expect(withBoth).toHaveLength(1);
  expect(withBoth[0].id).toBe(entity1.id);
});

test('EntityManager can clear all entities', () => {
  const manager = new EntityManager();

  manager.createEntity();
  manager.createEntity();
  expect(manager.getEntityCount()).toBe(2);

  manager.clear();
  expect(manager.getEntityCount()).toBe(0);
  expect(manager.getAllEntities()).toHaveLength(0);
});
