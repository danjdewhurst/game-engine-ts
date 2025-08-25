import type { System, Entity, EntityId } from '../types';
import type { InputComponent } from '../components/Input';
import { globalInputHandler } from '../utils/InputHandler';

export class InputSystem implements System {
  public readonly name = 'InputSystem';

  public update(_deltaTime: number, entities: Map<EntityId, Entity>): void {
    const currentKeyState = globalInputHandler.getKeyState();

    for (const entity of entities.values()) {
      const input = entity.components.get('Input') as
        | InputComponent
        | undefined;

      if (!input) continue;

      // Update input component with current key states
      input.keys = { ...currentKeyState };
    }
  }
}
