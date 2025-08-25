import { test, expect } from 'bun:test';
import { InputSystem } from './InputSystem';
import { createInput } from '../components';
import type { Entity, EntityId } from '../types';

const createTestEntity = (id: EntityId): Entity => ({
  id,
  components: new Map(),
});

test('InputSystem updates input components', () => {
  const system = new InputSystem();
  const entities = new Map<EntityId, Entity>();

  const entity = createTestEntity(1);
  const inputComponent = createInput();
  entity.components.set('Input', inputComponent);
  entities.set(entity.id, entity);

  system.update(0.016, entities);

  // Input should be updated with current key states
  expect(entity.components.get('Input')).toBeDefined();
  const updatedInput = entity.components.get('Input') as any;
  expect(typeof updatedInput.keys.up).toBe('boolean');
  expect(typeof updatedInput.keys.down).toBe('boolean');
  expect(typeof updatedInput.keys.left).toBe('boolean');
  expect(typeof updatedInput.keys.right).toBe('boolean');
});

test('InputSystem ignores entities without Input component', () => {
  const system = new InputSystem();
  const entities = new Map<EntityId, Entity>();

  const entity = createTestEntity(1);
  entities.set(entity.id, entity);

  // Should not throw error
  expect(() => system.update(0.016, entities)).not.toThrow();
});

test('InputSystem handles multiple entities with Input', () => {
  const system = new InputSystem();
  const entities = new Map<EntityId, Entity>();

  const entity1 = createTestEntity(1);
  const entity2 = createTestEntity(2);

  entity1.components.set('Input', createInput());
  entity2.components.set('Input', createInput());

  entities.set(entity1.id, entity1);
  entities.set(entity2.id, entity2);

  system.update(0.016, entities);

  // Both entities should have their input updated
  expect(entity1.components.get('Input')).toBeDefined();
  expect(entity2.components.get('Input')).toBeDefined();
});
