import type { System, Entity, EntityId } from '../types';
import type { TransformComponent, VelocityComponent } from '../components';

export class MovementSystem implements System {
  public readonly name = 'MovementSystem';

  public update(deltaTime: number, entities: Map<EntityId, Entity>): void {
    for (const entity of entities.values()) {
      const transform = entity.components.get('Transform') as
        | TransformComponent
        | undefined;
      const velocity = entity.components.get('Velocity') as
        | VelocityComponent
        | undefined;

      if (!transform || !velocity) continue;

      // Apply velocity to position
      transform.position.x += velocity.velocity.x * deltaTime;
      transform.position.y += velocity.velocity.y * deltaTime;

      // Apply max speed constraint if specified
      if (velocity.maxSpeed !== undefined) {
        const currentSpeed = Math.sqrt(
          velocity.velocity.x ** 2 + velocity.velocity.y ** 2
        );

        if (currentSpeed > velocity.maxSpeed) {
          const scale = velocity.maxSpeed / currentSpeed;
          velocity.velocity.x *= scale;
          velocity.velocity.y *= scale;
        }
      }
    }
  }
}
