import type { System, Entity, EntityId } from '../types';
import type { InputComponent } from '../components/Input';
import type { PlayerControllerComponent } from '../components/PlayerController';
import type { VelocityComponent } from '../components/Velocity';

export class PlayerControlSystem implements System {
  public readonly name = 'PlayerControlSystem';

  public update(deltaTime: number, entities: Map<EntityId, Entity>): void {
    for (const entity of entities.values()) {
      const input = entity.components.get('Input') as
        | InputComponent
        | undefined;
      const controller = entity.components.get('PlayerController') as
        | PlayerControllerComponent
        | undefined;
      const velocity = entity.components.get('Velocity') as
        | VelocityComponent
        | undefined;

      if (!input || !controller || !velocity || !controller.isControllable) {
        continue;
      }

      // Calculate desired movement direction
      let targetVelocityX = 0;
      let targetVelocityY = 0;

      if (input.keys.left) {
        targetVelocityX -= controller.speed;
      }
      if (input.keys.right) {
        targetVelocityX += controller.speed;
      }
      if (input.keys.up) {
        targetVelocityY -= controller.speed;
      }
      if (input.keys.down) {
        targetVelocityY += controller.speed;
      }

      // Normalize diagonal movement to prevent faster diagonal speed
      if (targetVelocityX !== 0 && targetVelocityY !== 0) {
        const factor = Math.sqrt(0.5); // 1/sqrt(2) to normalize diagonal movement
        targetVelocityX *= factor;
        targetVelocityY *= factor;
      }

      // Apply acceleration/deceleration
      const currentVx = velocity.velocity.x;
      const currentVy = velocity.velocity.y;

      // X-axis movement
      if (targetVelocityX !== 0) {
        // Accelerating towards target
        if (Math.abs(targetVelocityX - currentVx) > 0.1) {
          const accelX = controller.acceleration * deltaTime;
          if (targetVelocityX > currentVx) {
            velocity.velocity.x = Math.min(currentVx + accelX, targetVelocityX);
          } else {
            velocity.velocity.x = Math.max(currentVx - accelX, targetVelocityX);
          }
        } else {
          velocity.velocity.x = targetVelocityX;
        }
      } else {
        // Decelerating to stop
        if (Math.abs(currentVx) > 0.1) {
          const decelX = controller.deceleration * deltaTime;
          if (currentVx > 0) {
            velocity.velocity.x = Math.max(currentVx - decelX, 0);
          } else {
            velocity.velocity.x = Math.min(currentVx + decelX, 0);
          }
        } else {
          velocity.velocity.x = 0;
        }
      }

      // Y-axis movement
      if (targetVelocityY !== 0) {
        // Accelerating towards target
        if (Math.abs(targetVelocityY - currentVy) > 0.1) {
          const accelY = controller.acceleration * deltaTime;
          if (targetVelocityY > currentVy) {
            velocity.velocity.y = Math.min(currentVy + accelY, targetVelocityY);
          } else {
            velocity.velocity.y = Math.max(currentVy - accelY, targetVelocityY);
          }
        } else {
          velocity.velocity.y = targetVelocityY;
        }
      } else {
        // Decelerating to stop
        if (Math.abs(currentVy) > 0.1) {
          const decelY = controller.deceleration * deltaTime;
          if (currentVy > 0) {
            velocity.velocity.y = Math.max(currentVy - decelY, 0);
          } else {
            velocity.velocity.y = Math.min(currentVy + decelY, 0);
          }
        } else {
          velocity.velocity.y = 0;
        }
      }
    }
  }
}
