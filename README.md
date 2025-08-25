# 🎮 TypeScript ECS Game Engine

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Bun](https://img.shields.io/badge/Runtime-Bun-orange?logo=bun)](https://bun.sh)
[![ECS](https://img.shields.io/badge/Architecture-ECS-green)](https://en.wikipedia.org/wiki/Entity_component_system)
[![WebSocket](https://img.shields.io/badge/Multiplayer-WebSocket-purple)](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API)

A high-performance, extensible game engine built with **TypeScript** and **Bun**, featuring **Entity-Component-System (ECS)** architecture, real-time multiplayer support, and an event-driven design for maximum extensibility.

## ⚠️ **Experimental Project Notice**

> **🧪 This is an experimental learning repository**
>
> This project was created as a **learning exercise** to explore ECS architecture, game engine development, and TypeScript. It is **NOT intended for production use**.
>
> **Important considerations:**
>
> - 🚫 **No production readiness** - Missing enterprise features, error handling, and optimizations
> - 📚 **Learning focused** - Built for educational purposes and experimentation
> - 🔄 **No guaranteed updates** - May receive zero future updates or maintenance
> - 🙅‍♂️ **No support provided** - Use at your own risk, no support or warranties
> - 🧩 **Proof of concept** - Demonstrates concepts rather than production-ready solutions
>
> Feel free to explore, learn from, and experiment with the code, but please consider mature alternatives for serious game development projects.

## ✨ Features

### 🏗️ **ECS Architecture**

- **Entities**: Unique game objects with component collections
- **Components**: Pure data containers (Transform, Velocity, Renderable, etc.)
- **Systems**: Game logic processors (Movement, Collision, Rendering, etc.)
- **Performance**: Optimized for 60 FPS with efficient entity management

### 🌐 **Real-Time Multiplayer**

- **WebSocket Server**: Built-in game server with client-server architecture
- **HTML5 Canvas Rendering**: 60 FPS client-side rendering
- **Authoritative Server**: Server-side game logic with client synchronization
- **Live Stats**: Real-time FPS, entity count, and ping monitoring

### 🎯 **Event-Driven Extensibility**

- **Global Event Dispatcher**: Comprehensive lifecycle event system
- **Custom Game Logic**: Easy to extend with custom components and systems
- **Runtime Hooks**: Modify behavior without changing core engine code
- **Performance Monitoring**: Built-in system profiling and analytics

### ⚡ **Developer Experience**

- **TypeScript**: Full type safety and IntelliSense support
- **Bun Runtime**: Lightning-fast package management and execution
- **Hot Reload**: Development server with automatic reloading
- **Testing**: Comprehensive test suite with 126+ tests

## 🏢 Project Structure

```
packages/
├── engine/                 # @game-engine/core
│   ├── src/
│   │   ├── engine/         # GameEngine with game loop
│   │   ├── entities/       # EntityManager for ECS
│   │   ├── components/     # Transform, Velocity, Renderable, etc.
│   │   ├── systems/        # Movement, Collision, Render systems
│   │   ├── events/         # EventDispatcher and event system
│   │   ├── server/         # GameServer with WebSocket support
│   │   └── utils/          # Math helpers and utilities
│   └── package.json
└── demo/                   # Demo games using the engine
    ├── src/                # Game implementations
    ├── public/             # HTML5 Canvas client files
    └── package.json
```

## 🚀 Quick Start

### Prerequisites

- [Bun](https://bun.sh) (latest version)
- Modern web browser

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd game-engine-ts

# Install dependencies
bun install

# Build all packages
bun run build
```

### Run a Demo

```bash
# Navigate to demos
cd packages/demo

# Start the basic multiplayer demo
bun run server
# Open http://localhost:3000

# Or try the zombie survival game
bun run zombie
# Open http://localhost:3001
```

## 🎮 Demos

### 🟢 **Basic Multiplayer Demo**

_Real-time multiplayer with smooth movement_

- **Players**: Join/leave dynamically with unique colors
- **Movement**: WASD/Arrow keys with physics-based collision
- **AI Entities**: Bouncing objects for visual interest
- **Features**: Player sync, collision detection, performance stats

```bash
cd packages/demo && bun run server
```

### 🧟‍♂️ **Zombie Survival**

_Action-packed survival game with combat mechanics_

- **Combat**: 8-directional shooting with bullet physics
- **AI**: Smart zombie spawning and pathfinding to closest player
- **Health System**: Real-time damage, health bars, player respawn
- **Progression**: Increasing difficulty with zombie wave spawning
- **Features**: Diagonal shooting, damage over time, visual health indicators

```bash
cd packages/demo && bun run zombie
```

### 🎯 **Interactive Demos**

_Terminal-based demos for development_

```bash
# Physics and collision testing
bun run collision

# Event system extensibility showcase
bun run extensible

# Interactive terminal gameplay
bun run interactive
```

## 🛠️ Development

### Available Scripts

```bash
# Development
bun run dev:engine          # Engine development mode
bun run dev:demo            # Demo development mode

# Testing
bun run test                # Run all tests (126+ tests)
bun test --filter="engine"  # Test only engine
bun test --filter="demo"    # Test only demos

# Code Quality
bun run format              # Format code with Biome
bun run lint                # Lint all packages
bun run check               # Type check and lint

# Building
bun run build               # Build all packages
```

### Creating Custom Games

```typescript
import {
  GameEngine,
  createTransform,
  createVelocity,
  MovementSystem,
} from "@game-engine/core";

// Create game engine
const engine = new GameEngine({ targetFPS: 60 });

// Add systems
engine.addSystem(new MovementSystem());

// Create entities
const player = engine.createEntity();
engine.addComponent(player.id, createTransform(100, 100));
engine.addComponent(player.id, createVelocity(50, 0));

// Start the game
engine.start();
```

## 🏗️ Architecture

### ECS Pattern

- **Composition over Inheritance**: Build complex entities from simple components
- **Data-Oriented Design**: Components are pure data, systems contain logic
- **Performance**: Cache-friendly iteration and efficient memory usage

### Event System

- **Lifecycle Events**: Entity created/destroyed, component added/removed
- **System Events**: System update start/end with performance metrics
- **Custom Events**: Extensible event system for game-specific logic

### Client-Server Model

- **Authoritative Server**: Game logic runs on server at 60 FPS
- **Client Rendering**: Smooth 60 FPS rendering with interpolation
- **State Synchronization**: 30 FPS game state broadcasting
- **Input Handling**: Client input with server validation

## 🎯 Core Components

| Component    | Purpose                   | Properties                        |
| ------------ | ------------------------- | --------------------------------- |
| `Transform`  | Position, rotation, scale | `position`, `rotation`, `scale`   |
| `Velocity`   | Movement and physics      | `velocity`, `maxSpeed`            |
| `Renderable` | Visual representation     | `shape`, `size`, `color`, `layer` |
| `Collider`   | Physics interactions      | `bounds`, `mass`, `restitution`   |
| `Input`      | Player input state        | `keys`, `mouse`                   |

## 🔧 Core Systems

| System            | Purpose               | Features                              |
| ----------------- | --------------------- | ------------------------------------- |
| `MovementSystem`  | Physics movement      | Velocity integration, max speed       |
| `CollisionSystem` | Collision detection   | AABB detection, physics resolution    |
| `RenderSystem`    | Game state generation | Layer sorting, client synchronization |
| `InputSystem`     | Input processing      | Keyboard, mouse, touch support        |

## 📊 Performance

- **60 FPS** game logic execution
- **30 FPS** network synchronization
- **Efficient ECS** with optimized component iteration
- **Memory Management** with object pooling for bullets/particles
- **Real-time Monitoring** with built-in performance metrics

## 🤝 Contributing

No contributions are wanted at this time as this is an experimental learning project.

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Bun](https://bun.sh) for incredible performance
- Inspired by modern ECS architectures and game development best practices
- HTML5 Canvas for cross-platform rendering
