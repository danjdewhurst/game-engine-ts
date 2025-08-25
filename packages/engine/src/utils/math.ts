import type { Vector2 } from '../types';

export const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

export const lerp = (a: number, b: number, t: number): number =>
  a + (b - a) * clamp(t, 0, 1);

export const distance = (a: Vector2, b: Vector2): number =>
  Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2);

export const normalize = (vector: Vector2): Vector2 => {
  const magnitude = Math.sqrt(vector.x ** 2 + vector.y ** 2);
  if (magnitude === 0) return { x: 0, y: 0 };
  return { x: vector.x / magnitude, y: vector.y / magnitude };
};

export const dot = (a: Vector2, b: Vector2): number => a.x * b.x + a.y * b.y;

export const magnitude = (vector: Vector2): number =>
  Math.sqrt(vector.x ** 2 + vector.y ** 2);

export const add = (a: Vector2, b: Vector2): Vector2 => ({
  x: a.x + b.x,
  y: a.y + b.y,
});

export const subtract = (a: Vector2, b: Vector2): Vector2 => ({
  x: a.x - b.x,
  y: a.y - b.y,
});

export const multiply = (vector: Vector2, scalar: number): Vector2 => ({
  x: vector.x * scalar,
  y: vector.y * scalar,
});

export const toRadians = (degrees: number): number => degrees * (Math.PI / 180);

export const toDegrees = (radians: number): number => radians * (180 / Math.PI);
