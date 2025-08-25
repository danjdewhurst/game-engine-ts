# TypeScript Game Engine Development Rules

## Project Structure (Monorepo)
This project uses a workspace-based monorepo structure:
```
packages/
├── engine/          # @game-engine/core - Core ECS game engine
│   ├── src/
│   │   ├── engine/      # GameEngine class with game loop
│   │   ├── entities/    # EntityManager for ECS
│   │   ├── components/  # Transform, Velocity, Input, PlayerController, Renderable, Collider
│   │   ├── systems/     # Movement, Input, PlayerControl, Render, Collision systems
│   │   ├── events/      # EventDispatcher and event system
│   │   ├── server/      # GameServer with WebSocket support
│   │   ├── utils/       # Math helpers, InputHandler, collision utilities
│   │   └── types/       # TypeScript type definitions
│   └── package.json     # Engine package config
└── demo/            # Demo game using the engine
    ├── src/         # Game implementation examples & server
    ├── public/      # HTML5 Canvas client files
    └── package.json # Depends on @game-engine/core
```

## Runtime & Package Management
- Always use Bun instead of Node.js
- Use `bun <file>` instead of `node <file>` or `ts-node <file>`
- Use `bun test` instead of `jest` or `vitest`
- Use `bun build <file.ts>` for TypeScript builds
- Use `bun install` instead of npm/yarn/pnpm
- Use `bun run <script>` for package.json scripts
- Bun automatically loads .env files - don't use dotenv
- Use `workspace:*` for internal package dependencies

## TypeScript Best Practices
- Use strict TypeScript settings
- Prefer `const` assertions with `as const` for immutable data
- Use `export type` for types and interfaces
- Use `import type` for type-only imports
- Avoid `any` type - use `unknown` for dynamic content
- Use function types instead of object types with call signatures
- Use `Array<T>` or `T[]` consistently (prefer `T[]` for game data)

## ECS Architecture Implementation
- **Entities**: Unique IDs with component maps (`Map<string, Component>`)
- **Components**: Data containers with readonly `type` property for identification
- **Systems**: Classes implementing `System` interface with `update(deltaTime, entities)` method
- **Events**: Central EventDispatcher for extensible behavior and lifecycle hooks
- Use `EntityManager` for entity/component operations
- Use `GameEngine` for system registration and game loop management
- Components are retrieved by type string from entity component maps
- All entity/component/system operations emit events for extensibility

## Game Engine Architecture
- Use composition over inheritance for game entities
- Implement systems as pure functions where possible
- Use TypeScript enums sparingly - prefer `const` objects with `as const`
- Structure game loops with fixed timesteps for deterministic behavior
- Separate logic, rendering, and input handling systems
- Use typed events/messages for component communication
- Engine runs at configurable FPS (default 60) with performance tracking
- Event-driven architecture enables runtime customization and extension
- All core operations emit events for user hooks and custom logic

## Performance Patterns
- Pre-allocate object pools for frequently created/destroyed objects
- Use `Float32Array` and `Uint32Array` for mathematical operations
- Avoid object creation in hot paths (game loops)
- Cache expensive calculations
- Use bit manipulation for flags and state management
- Prefer `for` loops over `Array.forEach` in performance-critical code
- Set maximum entity limits to prevent memory issues

## Current Components & Systems
- **TransformComponent**: Position, rotation, scale data
- **VelocityComponent**: Velocity vector with optional max speed
- **InputComponent**: Keyboard/mouse input state tracking
- **PlayerControllerComponent**: Player movement speed/acceleration settings
- **RenderableComponent**: Visual properties (shape, color, size, layer, visibility)
- **ColliderComponent**: Collision bounds, physics properties, collision layers
- **MovementSystem**: Applies velocity to transform positions
- **InputSystem**: Updates input components from terminal input (client-side)
- **ServerInputSystem**: No-op input system for server (WebSocket input handled manually)
- **PlayerControlSystem**: Translates input to smooth movement with acceleration/deceleration
- **CollisionSystem**: AABB collision detection with physics resolution and events
- **RenderSystem**: Generates game state for client rendering
- **EventDispatcher**: Central event system for extensible behavior
- **GameServer**: WebSocket server for multiplayer client-server architecture
- **Math utilities**: Vector operations, lerp, clamp, distance calculations
- **Collision utilities**: AABB detection, collision resolution, physics calculations
- **InputHandler**: Terminal keyboard capture for standalone games

## File I/O & Resources
- Use `Bun.file()` for file operations instead of `node:fs`
- Use `await Bun.file(path).json()` for JSON loading
- Use `await Bun.file(path).arrayBuffer()` for binary assets
- Implement resource caching to avoid redundant file reads

## Testing Game Logic
```ts
import { test, expect } from "bun:test";
import { EntityManager, globalEventDispatcher } from '@game-engine/core';
import { createTransform, createVelocity, createCollider, createRenderable } from '@game-engine/core';

test("entity component system", () => {
  const manager = new EntityManager();
  const entity = manager.createEntity();
  
  manager.addComponent(entity.id, createTransform(0, 0));
  manager.addComponent(entity.id, createVelocity(10, 5));
  manager.addComponent(entity.id, createRenderable('circle', 20, 20, '#ff0000'));
  
  const transform = manager.getComponent(entity.id, 'Transform');
  const velocity = manager.getComponent(entity.id, 'Velocity');
  const renderable = manager.getComponent(entity.id, 'Renderable');
  
  expect(transform?.position.x).toBe(0);
  expect(velocity?.velocity.x).toBe(10);
  expect(renderable?.color).toBe('#ff0000');
});

test("event system extensibility", () => {
  let eventReceived = false;
  
  globalEventDispatcher.on('entity:created', (event) => {
    eventReceived = true;
  });
  
  const manager = new EntityManager();
  manager.createEntity();
  
  expect(eventReceived).toBe(true);
});
```

## Development Commands
- `bun run dev:engine` - Test engine package directly
- `bun run dev:demo` - Run demo game (uses engine)
- `bun run interactive` - Run terminal-based interactive demo
- `bun run collision` - Run collision detection demo with physics
- `bun run extensible` - Run extensible demo showing event-driven customization
- `bun run server` - Start WebSocket game server on :3000
- `bun run build` - Build all workspace packages
- `bun run test` - Test all workspace packages (126+ tests)
- `bun run format` - Format all workspace packages with Biome
- `bun run lint` - Lint all workspace packages
- `bun run check` - Check all workspace packages

## Package-Specific Commands
- `cd packages/engine && bun run dev` - Engine development mode
- `cd packages/demo && bun run dev` - Demo development mode
- `cd packages/demo && bun run server` - Start game server
- `bun --filter="@game-engine/core" test` - Test only engine
- `bun --filter="demo-game" test` - Test only demo

## Client-Server Architecture
- **Server (Bun)**: Authoritative game logic, physics, AI, WebSocket server
- **Client (HTML5 Canvas)**: Rendering, input capture, real-time display
- **WebSocket Protocol**: Real-time game state sync at 30 FPS
- **Input Flow**: Browser → WebSocket → Server → Game Logic → Broadcast
- **Rendering Flow**: Server Game State → WebSocket → Client → Canvas Rendering
- **Multiplayer Support**: Multiple players can join/leave dynamically

## Game Features Implemented
- **Real-time multiplayer** with WebSocket communication
- **Smooth player movement** with WASD/Arrow keys from web browser
- **HTML5 Canvas rendering** at 60 FPS client-side
- **Authoritative server** running game logic at 60 FPS
- **Terminal-based demo** for development testing
- **Entity-Component-System** architecture throughout
- **Event-driven extensibility** with comprehensive lifecycle events
- **Collision detection** with AABB physics and collision layers
- **Performance monitoring** (FPS, ping, entity count, system profiling)
- **Visual entities** with shapes, colors, layers, opacity
- **Input handling** for both web and terminal clients
- **Physics simulation** with mass, restitution, friction, static objects
- **Trigger systems** for pickups, zones, and non-physical interactions

## Event System for Extensibility
- **Entity events**: `entity:created`, `entity:destroyed`, `component:added`, `component:removed`
- **System events**: `system:added`, `system:removed`, `system:update:start`, `system:update:end`
- **Engine events**: `engine:started`, `engine:stopped`, `engine:paused`, `engine:resumed`, `engine:tick`
- **Collision events**: `collision:detected`, `trigger:activated`
- **Custom events**: Users can emit and listen to custom game events
- **Event filtering**: Advanced conditional event handling
- **Performance tracking**: Built-in system performance monitoring through events
- **Runtime modification**: Add/remove event listeners during gameplay
- **Event history**: Query past events for debugging and analytics

## Engine Extensibility Examples
```ts
// Custom health system responding to collisions
globalEventDispatcher.on('collision:detected', (event) => {
  const playerEntity = getPlayerEntity(event.entityA, event.entityB);
  if (playerEntity) {
    applyDamage(playerEntity, 10);
    emitCustomEvent('player:damaged', { damage: 10 });
  }
});

// Performance monitoring and optimization
globalEventDispatcher.on('system:update:end', (event) => {
  if (event.duration > 16) {
    console.warn(`Slow system: ${event.systemName} took ${event.duration}ms`);
  }
});

// Custom scoring and achievements
globalEventDispatcher.on('trigger:activated', (event) => {
  if (isPickup(event.entityB)) {
    addScore(100);
    destroyEntity(event.entityB);
    checkAchievements();
  }
});

// Dynamic system modification
globalEventDispatcher.on('player:powerup', (event) => {
  if (event.powerType === 'speed') {
    modifyPlayerSpeed(event.entityId, 2.0);
    setTimeout(() => modifyPlayerSpeed(event.entityId, 1.0), 5000);
  }
});
```
