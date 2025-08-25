import type { Component, Vector2 } from '../types';

export type VelocityComponent = Component & {
  readonly type: 'Velocity';
  velocity: Vector2;
  maxSpeed?: number;
};

export const createVelocity = (
  x = 0,
  y = 0,
  maxSpeed?: number
): VelocityComponent => ({
  type: 'Velocity',
  velocity: { x, y },
  maxSpeed,
});
