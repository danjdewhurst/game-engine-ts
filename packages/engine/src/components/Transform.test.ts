import { test, expect } from 'bun:test';
import { createTransform } from './Transform';

test('createTransform creates default transform', () => {
  const transform = createTransform();

  expect(transform.type).toBe('Transform');
  expect(transform.position.x).toBe(0);
  expect(transform.position.y).toBe(0);
  expect(transform.rotation).toBe(0);
  expect(transform.scale.x).toBe(1);
  expect(transform.scale.y).toBe(1);
});

test('createTransform creates transform with custom position', () => {
  const transform = createTransform(100, 200);

  expect(transform.position.x).toBe(100);
  expect(transform.position.y).toBe(200);
  expect(transform.rotation).toBe(0);
  expect(transform.scale.x).toBe(1);
  expect(transform.scale.y).toBe(1);
});

test('createTransform creates transform with all parameters', () => {
  const transform = createTransform(10, 20, Math.PI / 4, 2, 3);

  expect(transform.position.x).toBe(10);
  expect(transform.position.y).toBe(20);
  expect(transform.rotation).toBe(Math.PI / 4);
  expect(transform.scale.x).toBe(2);
  expect(transform.scale.y).toBe(3);
});

test('transform position can be modified', () => {
  const transform = createTransform(0, 0);

  transform.position.x = 50;
  transform.position.y = 75;

  expect(transform.position.x).toBe(50);
  expect(transform.position.y).toBe(75);
});
