import type { Component } from '../types';

export type PlayerControllerComponent = Component & {
  readonly type: 'PlayerController';
  speed: number;
  acceleration: number;
  deceleration: number;
  isControllable: boolean;
};

export const createPlayerController = (
  speed = 100,
  acceleration = 200,
  deceleration = 150
): PlayerControllerComponent => ({
  type: 'PlayerController',
  speed,
  acceleration,
  deceleration,
  isControllable: true,
});
