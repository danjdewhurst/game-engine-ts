import type { Component, Vector2 } from '../types';

export type RenderableComponent = Component & {
  readonly type: 'Renderable';
  shape: 'rectangle' | 'circle' | 'sprite';
  size: Vector2;
  color: string;
  opacity: number;
  layer: number;
  visible: boolean;
  spriteUrl?: string;
};

export const createRenderable = (
  shape: 'rectangle' | 'circle' | 'sprite' = 'rectangle',
  width = 20,
  height = 20,
  color = '#ffffff',
  opacity = 1.0,
  layer = 0
): RenderableComponent => ({
  type: 'Renderable',
  shape,
  size: { x: width, y: height },
  color,
  opacity,
  layer,
  visible: true,
  spriteUrl: shape === 'sprite' ? undefined : undefined,
});

export type GameState = {
  entities: Array<{
    id: number;
    position: Vector2;
    rotation: number;
    scale: Vector2;
    renderable?: {
      shape: string;
      size: Vector2;
      color: string;
      opacity: number;
      layer: number;
      visible: boolean;
      spriteUrl?: string;
    };
  }>;
  timestamp: number;
  stats: {
    fps: number;
    entityCount: number;
    deltaTime: number;
  };
};

export type ClientMessage =
  | {
      type: 'input';
      playerId: string;
      keys: {
        up: boolean;
        down: boolean;
        left: boolean;
        right: boolean;
        space: boolean;
      };
      timestamp: number;
    }
  | {
      type: 'join';
      playerId: string;
    }
  | {
      type: 'leave';
      playerId: string;
    };

export type ServerMessage =
  | {
      type: 'gameState';
      data: GameState;
    }
  | {
      type: 'playerJoined';
      playerId: string;
      entityId: number;
    }
  | {
      type: 'playerLeft';
      playerId: string;
    }
  | {
      type: 'error';
      message: string;
    };
