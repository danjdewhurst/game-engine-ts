export type EntityId = number;

export type Component = {
  readonly type: string;
};

export type System = {
  readonly name: string;
  update(deltaTime: number, entities: Map<EntityId, Entity>): void;
};

export type Entity = {
  readonly id: EntityId;
  components: Map<string, Component>;
};

export type Vector2 = {
  x: number;
  y: number;
};

export type GameEngineOptions = {
  targetFPS?: number;
  maxEntities?: number;
};

export type GameLoop = {
  start(): void;
  stop(): void;
  pause(): void;
  resume(): void;
  readonly isRunning: boolean;
  readonly isPaused: boolean;
};
