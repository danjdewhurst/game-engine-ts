import { test, expect } from 'bun:test';
import { createPlayerController } from './PlayerController';

test('createPlayerController creates default controller', () => {
  const controller = createPlayerController();

  expect(controller.type).toBe('PlayerController');
  expect(controller.speed).toBe(100);
  expect(controller.acceleration).toBe(200);
  expect(controller.deceleration).toBe(150);
  expect(controller.isControllable).toBe(true);
});

test('createPlayerController creates controller with custom values', () => {
  const controller = createPlayerController(50, 300, 250);

  expect(controller.speed).toBe(50);
  expect(controller.acceleration).toBe(300);
  expect(controller.deceleration).toBe(250);
  expect(controller.isControllable).toBe(true);
});

test('controller properties can be modified', () => {
  const controller = createPlayerController();

  controller.speed = 75;
  controller.acceleration = 180;
  controller.deceleration = 120;
  controller.isControllable = false;

  expect(controller.speed).toBe(75);
  expect(controller.acceleration).toBe(180);
  expect(controller.deceleration).toBe(120);
  expect(controller.isControllable).toBe(false);
});
