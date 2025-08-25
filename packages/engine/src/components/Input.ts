import type { Component, Vector2 } from '../types';

export type InputState = {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  space: boolean;
  enter: boolean;
  escape: boolean;
};

export type InputComponent = Component & {
  readonly type: 'Input';
  keys: InputState;
  mousePosition: Vector2;
  mouseButtons: {
    left: boolean;
    right: boolean;
    middle: boolean;
  };
};

export const createInput = (): InputComponent => ({
  type: 'Input',
  keys: {
    up: false,
    down: false,
    left: false,
    right: false,
    space: false,
    enter: false,
    escape: false,
  },
  mousePosition: { x: 0, y: 0 },
  mouseButtons: {
    left: false,
    right: false,
    middle: false,
  },
});

export type KeyCode =
  | 'ArrowUp'
  | 'ArrowDown'
  | 'ArrowLeft'
  | 'ArrowRight'
  | 'w'
  | 'a'
  | 's'
  | 'd'
  | 'W'
  | 'A'
  | 'S'
  | 'D'
  | ' '
  | 'Enter'
  | 'Escape';

export const keyMapping: Record<string, keyof InputState> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  w: 'up',
  W: 'up',
  s: 'down',
  S: 'down',
  a: 'left',
  A: 'left',
  d: 'right',
  D: 'right',
  ' ': 'space',
  Enter: 'enter',
  Escape: 'escape',
} as const;
