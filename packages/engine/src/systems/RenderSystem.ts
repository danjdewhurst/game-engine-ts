import type { System, Entity, EntityId } from '../types';
import type { TransformComponent } from '../components/Transform';
import type { RenderableComponent, GameState } from '../components/Renderable';

export class RenderSystem implements System {
  public readonly name = 'RenderSystem';
  private lastGameState: GameState | null = null;

  public update(_deltaTime: number, entities: Map<EntityId, Entity>): void {
    // Generate game state for clients
    this.lastGameState = this.generateGameState(entities, _deltaTime);
  }

  private generateGameState(
    entities: Map<EntityId, Entity>,
    deltaTime: number
  ): GameState {
    const renderableEntities: GameState['entities'] = [];

    for (const entity of entities.values()) {
      const transform = entity.components.get('Transform') as
        | TransformComponent
        | undefined;
      const renderable = entity.components.get('Renderable') as
        | RenderableComponent
        | undefined;

      if (!transform) continue;

      const entityData: GameState['entities'][0] = {
        id: entity.id,
        position: { ...transform.position },
        rotation: transform.rotation,
        scale: { ...transform.scale },
      };

      if (renderable && renderable.visible) {
        entityData.renderable = {
          shape: renderable.shape,
          size: { ...renderable.size },
          color: renderable.color,
          opacity: renderable.opacity,
          layer: renderable.layer,
          visible: renderable.visible,
          spriteUrl: renderable.spriteUrl,
        };
      }

      renderableEntities.push(entityData);
    }

    // Sort by layer for proper rendering order
    renderableEntities.sort((a, b) => {
      const layerA = a.renderable?.layer ?? 0;
      const layerB = b.renderable?.layer ?? 0;
      return layerA - layerB;
    });

    return {
      entities: renderableEntities,
      timestamp: Date.now(),
      stats: {
        fps: 1 / deltaTime,
        entityCount: entities.size,
        deltaTime,
      },
    };
  }

  public getGameState(): GameState | null {
    return this.lastGameState;
  }
}
