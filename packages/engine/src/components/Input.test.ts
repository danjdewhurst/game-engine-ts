import { test, expect } from 'bun:test';
import { createInput, keyMapping } from './Input';

test('createInput creates default input state', () => {
  const input = createInput();

  expect(input.type).toBe('Input');
  expect(input.keys.up).toBe(false);
  expect(input.keys.down).toBe(false);
  expect(input.keys.left).toBe(false);
  expect(input.keys.right).toBe(false);
  expect(input.keys.space).toBe(false);
  expect(input.keys.enter).toBe(false);
  expect(input.keys.escape).toBe(false);
  expect(input.mousePosition.x).toBe(0);
  expect(input.mousePosition.y).toBe(0);
  expect(input.mouseButtons.left).toBe(false);
  expect(input.mouseButtons.right).toBe(false);
  expect(input.mouseButtons.middle).toBe(false);
});

test('input state can be modified', () => {
  const input = createInput();

  input.keys.up = true;
  input.keys.space = true;
  input.mousePosition.x = 100;
  input.mousePosition.y = 200;
  input.mouseButtons.left = true;

  expect(input.keys.up).toBe(true);
  expect(input.keys.space).toBe(true);
  expect(input.mousePosition.x).toBe(100);
  expect(input.mousePosition.y).toBe(200);
  expect(input.mouseButtons.left).toBe(true);
});

test('keyMapping maps keys correctly', () => {
  expect(keyMapping['ArrowUp']).toBe('up');
  expect(keyMapping['ArrowDown']).toBe('down');
  expect(keyMapping['ArrowLeft']).toBe('left');
  expect(keyMapping['ArrowRight']).toBe('right');
  expect(keyMapping['w']).toBe('up');
  expect(keyMapping['W']).toBe('up');
  expect(keyMapping['s']).toBe('down');
  expect(keyMapping['S']).toBe('down');
  expect(keyMapping['a']).toBe('left');
  expect(keyMapping['A']).toBe('left');
  expect(keyMapping['d']).toBe('right');
  expect(keyMapping['D']).toBe('right');
  expect(keyMapping[' ']).toBe('space');
  expect(keyMapping['Enter']).toBe('enter');
  expect(keyMapping['Escape']).toBe('escape');
});
