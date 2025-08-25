import type { Component, Vector2 } from '../types';

export type TransformComponent = Component & {
  readonly type: 'Transform';
  position: Vector2;
  rotation: number;
  scale: Vector2;
};

export const createTransform = (
  x = 0,
  y = 0,
  rotation = 0,
  scaleX = 1,
  scaleY = 1
): TransformComponent => ({
  type: 'Transform',
  position: { x, y },
  rotation,
  scale: { x: scaleX, y: scaleY },
});
