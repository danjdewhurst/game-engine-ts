import type { Component, Vector2 } from '../types';

export type BoundingBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type CollisionLayer = number;

export type ColliderComponent = Component & {
  readonly type: 'Collider';
  boundingBox: BoundingBox;
  layer: CollisionLayer;
  isTrigger: boolean;
  isStatic: boolean;
  mass: number;
  restitution: number; // Bounciness (0 = no bounce, 1 = perfect bounce)
  friction: number; // Surface friction (0 = no friction, 1 = max friction)
};

export const createCollider = (
  width = 20,
  height = 20,
  layer: CollisionLayer = 0,
  options: Partial<{
    isTrigger: boolean;
    isStatic: boolean;
    mass: number;
    restitution: number;
    friction: number;
  }> = {}
): ColliderComponent => ({
  type: 'Collider',
  boundingBox: {
    x: 0,
    y: 0,
    width,
    height,
  },
  layer,
  isTrigger: options.isTrigger ?? false,
  isStatic: options.isStatic ?? false,
  mass: options.mass ?? 1.0,
  restitution: options.restitution ?? 0.5,
  friction: options.friction ?? 0.1,
});

export type Collision = {
  entityA: number;
  entityB: number;
  normal: Vector2;
  penetration: number;
  contactPoint: Vector2;
  timestamp: number;
};

export type CollisionEvent = {
  type: 'collision' | 'trigger';
  collision: Collision;
  entityA: number;
  entityB: number;
};

export const CollisionLayers = {
  DEFAULT: 0,
  PLAYER: 1,
  ENEMY: 2,
  PROJECTILE: 3,
  WALL: 4,
  PICKUP: 5,
  TRIGGER: 6,
} as const;

export type CollisionLayerType =
  (typeof CollisionLayers)[keyof typeof CollisionLayers];

// Collision layer matrix - defines which layers can collide with each other
export const CollisionMatrix: Record<CollisionLayer, CollisionLayer[]> = {
  [CollisionLayers.DEFAULT]: [
    CollisionLayers.DEFAULT,
    CollisionLayers.PLAYER,
    CollisionLayers.ENEMY,
    CollisionLayers.WALL,
  ],
  [CollisionLayers.PLAYER]: [
    CollisionLayers.DEFAULT,
    CollisionLayers.ENEMY,
    CollisionLayers.WALL,
    CollisionLayers.PICKUP,
    CollisionLayers.TRIGGER,
  ],
  [CollisionLayers.ENEMY]: [
    CollisionLayers.DEFAULT,
    CollisionLayers.PLAYER,
    CollisionLayers.WALL,
    CollisionLayers.PROJECTILE,
  ],
  [CollisionLayers.PROJECTILE]: [CollisionLayers.ENEMY, CollisionLayers.WALL],
  [CollisionLayers.WALL]: [
    CollisionLayers.DEFAULT,
    CollisionLayers.PLAYER,
    CollisionLayers.ENEMY,
    CollisionLayers.PROJECTILE,
  ],
  [CollisionLayers.PICKUP]: [CollisionLayers.PLAYER],
  [CollisionLayers.TRIGGER]: [CollisionLayers.PLAYER],
};

export const canLayersCollide = (
  layerA: CollisionLayer,
  layerB: CollisionLayer
): boolean => {
  return CollisionMatrix[layerA]?.includes(layerB) ?? false;
};
