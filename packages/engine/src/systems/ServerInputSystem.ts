import type { System, Entity, EntityId } from '../types';

export class ServerInputSystem implements System {
  public readonly name = 'ServerInputSystem';

  public update(_deltaTime: number, _entities: Map<EntityId, Entity>): void {
    // Server input system does nothing - input is managed manually via WebSocket
    // This system exists to maintain compatibility with the engine's system requirements
    // but doesn't override input states that are set externally from WebSocket messages
  }
}
