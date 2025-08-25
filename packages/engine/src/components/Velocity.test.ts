import { test, expect } from 'bun:test';
import { createVelocity } from './Velocity';

test('createVelocity creates default velocity', () => {
  const velocity = createVelocity();

  expect(velocity.type).toBe('Velocity');
  expect(velocity.velocity.x).toBe(0);
  expect(velocity.velocity.y).toBe(0);
  expect(velocity.maxSpeed).toBeUndefined();
});

test('createVelocity creates velocity with custom values', () => {
  const velocity = createVelocity(10, -5);

  expect(velocity.velocity.x).toBe(10);
  expect(velocity.velocity.y).toBe(-5);
  expect(velocity.maxSpeed).toBeUndefined();
});

test('createVelocity creates velocity with max speed', () => {
  const velocity = createVelocity(20, 30, 100);

  expect(velocity.velocity.x).toBe(20);
  expect(velocity.velocity.y).toBe(30);
  expect(velocity.maxSpeed).toBe(100);
});

test('velocity can be modified', () => {
  const velocity = createVelocity(0, 0);

  velocity.velocity.x = 25;
  velocity.velocity.y = -15;
  velocity.maxSpeed = 50;

  expect(velocity.velocity.x).toBe(25);
  expect(velocity.velocity.y).toBe(-15);
  expect(velocity.maxSpeed).toBe(50);
});
