import { test, expect } from 'bun:test';
import {
  clamp,
  lerp,
  distance,
  normalize,
  dot,
  magnitude,
  add,
  subtract,
  multiply,
  toRadians,
  toDegrees,
} from './math';

test('clamp constrains value within bounds', () => {
  expect(clamp(5, 0, 10)).toBe(5);
  expect(clamp(-5, 0, 10)).toBe(0);
  expect(clamp(15, 0, 10)).toBe(10);
});

test('lerp interpolates between values', () => {
  expect(lerp(0, 10, 0)).toBe(0);
  expect(lerp(0, 10, 1)).toBe(10);
  expect(lerp(0, 10, 0.5)).toBe(5);
  expect(lerp(10, 20, 0.3)).toBe(13);
});

test('lerp clamps t parameter', () => {
  expect(lerp(0, 10, -0.5)).toBe(0);
  expect(lerp(0, 10, 1.5)).toBe(10);
});

test('distance calculates vector distance', () => {
  expect(distance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
  expect(distance({ x: 1, y: 1 }, { x: 4, y: 5 })).toBe(5);
  expect(distance({ x: 0, y: 0 }, { x: 0, y: 0 })).toBe(0);
});

test('normalize creates unit vector', () => {
  const normalized = normalize({ x: 3, y: 4 });
  expect(normalized.x).toBeCloseTo(0.6);
  expect(normalized.y).toBeCloseTo(0.8);
  expect(magnitude(normalized)).toBeCloseTo(1);
});

test('normalize handles zero vector', () => {
  const normalized = normalize({ x: 0, y: 0 });
  expect(normalized.x).toBe(0);
  expect(normalized.y).toBe(0);
});

test('dot calculates dot product', () => {
  expect(dot({ x: 1, y: 0 }, { x: 0, y: 1 })).toBe(0);
  expect(dot({ x: 1, y: 0 }, { x: 1, y: 0 })).toBe(1);
  expect(dot({ x: 3, y: 4 }, { x: 2, y: 1 })).toBe(10);
});

test('magnitude calculates vector magnitude', () => {
  expect(magnitude({ x: 3, y: 4 })).toBe(5);
  expect(magnitude({ x: 0, y: 0 })).toBe(0);
  expect(magnitude({ x: -3, y: -4 })).toBe(5);
});

test('add combines vectors', () => {
  const result = add({ x: 1, y: 2 }, { x: 3, y: 4 });
  expect(result.x).toBe(4);
  expect(result.y).toBe(6);
});

test('subtract computes vector difference', () => {
  const result = subtract({ x: 5, y: 3 }, { x: 2, y: 1 });
  expect(result.x).toBe(3);
  expect(result.y).toBe(2);
});

test('multiply scales vector', () => {
  const result = multiply({ x: 2, y: 3 }, 4);
  expect(result.x).toBe(8);
  expect(result.y).toBe(12);
});

test('toRadians converts degrees to radians', () => {
  expect(toRadians(0)).toBe(0);
  expect(toRadians(180)).toBeCloseTo(Math.PI);
  expect(toRadians(90)).toBeCloseTo(Math.PI / 2);
  expect(toRadians(360)).toBeCloseTo(2 * Math.PI);
});

test('toDegrees converts radians to degrees', () => {
  expect(toDegrees(0)).toBe(0);
  expect(toDegrees(Math.PI)).toBeCloseTo(180);
  expect(toDegrees(Math.PI / 2)).toBeCloseTo(90);
  expect(toDegrees(2 * Math.PI)).toBeCloseTo(360);
});
