import {
  GameEngine,
  ServerInputSystem,
  PlayerControlSystem,
  MovementSystem,
  CollisionSystem,
  RenderSystem,
  createTransform,
  createVelocity,
  createInput,
  createPlayerController,
  createRenderable,
  createCollider,
  CollisionLayers,
  globalEventDispatcher,
  globalInputHandler,
} from '@game-engine/core';

// Example of extending the engine with custom event-driven features
class HealthComponent {
  public readonly type = 'Health';
  constructor(
    public health: number,
    public maxHealth: number
  ) {}
}

class ScoreComponent {
  public readonly type = 'Score';
  constructor(public score: number = 0) {}
}

// Custom event-driven systems
class HealthSystem {
  public readonly name = 'HealthSystem';

  constructor() {
    // Listen for collision events to handle damage
    globalEventDispatcher.on('collision:detected', (event) => {
      // Example: Player takes damage when hitting enemies
      // Users can customize this behavior by modifying event handlers
      this.handleCollisionDamage(event);
    });
  }

  private handleCollisionDamage(event: any) {
    // This is where users can customize damage logic through events
    console.log(
      `🩸 Collision damage logic triggered for entities ${event.entityA}, ${event.entityB}`
    );
  }

  public update(_deltaTime: number, _entities: any): void {
    // Health system logic here
  }
}

class ScoreSystem {
  public readonly name = 'ScoreSystem';

  constructor() {
    // Listen for trigger events (pickups) to award points
    globalEventDispatcher.on('trigger:activated', (event) => {
      this.handlePickupScore(event);
    });

    // Listen for entity destruction to award points
    globalEventDispatcher.on('entity:destroyed', (event) => {
      this.handleEntityDestruction(event);
    });
  }

  private handlePickupScore(event: any) {
    console.log(`💰 Pickup scored! +10 points for player`);

    // Emit custom score event that users can listen to
    globalEventDispatcher.emit({
      type: 'score:increased',
      entityId: event.entityA, // Assuming entityA is player
      points: 10,
      reason: 'pickup',
      timestamp: Date.now(),
    });
  }

  private handleEntityDestruction(event: any) {
    console.log(`💥 Entity destroyed: ${event.entityId}`);
  }

  public update(_deltaTime: number, _entities: any): void {
    // Score system logic here
  }
}

// Example user customization through events
class CustomGameLogic {
  private playerScore = 0;
  private gameStartTime = Date.now();

  constructor() {
    this.setupEventListeners();
  }

  private setupEventListeners() {
    // Example: Track game performance
    globalEventDispatcher.on('engine:tick', (event) => {
      // Users can add custom logic here
      if (event.fps < 30) {
        console.log('⚠️ Performance warning: Low FPS detected');
      }
    });

    // Example: Custom entity creation logic
    globalEventDispatcher.on('entity:created', (event) => {
      console.log(`✨ New entity created: ${event.entityId}`);

      // Users can auto-add components or modify entities here
      // This is a powerful extension point
    });

    // Example: Component modification tracking
    globalEventDispatcher.on('component:added', (event) => {
      console.log(
        `🔧 Component ${event.component.type} added to entity ${event.entityId}`
      );
    });

    // Example: System performance monitoring
    globalEventDispatcher.on('system:update:end', (event) => {
      if (event.duration > 16) {
        // More than 16ms
        console.log(
          `⏱️ Slow system detected: ${event.systemName} took ${event.duration.toFixed(2)}ms`
        );
      }
    });

    // Example: Custom scoring system
    globalEventDispatcher.on('score:increased', (event: any) => {
      this.playerScore += event.points;
      console.log(
        `🏆 Total Score: ${this.playerScore} (+${event.points} for ${event.reason})`
      );

      // Check for achievements
      if (this.playerScore >= 100) {
        globalEventDispatcher.emit({
          type: 'achievement:unlocked',
          achievement: 'centurion',
          description: 'Score 100 points',
          timestamp: Date.now(),
        });
      }
    });

    // Example: Achievement system
    globalEventDispatcher.on('achievement:unlocked', (event: any) => {
      console.log(
        `🏅 Achievement Unlocked: ${event.achievement} - ${event.description}`
      );
    });

    // Example: Game session tracking
    globalEventDispatcher.on('engine:started', () => {
      console.log('🎮 Game session started');
      this.gameStartTime = Date.now();
    });

    globalEventDispatcher.on('engine:stopped', () => {
      const sessionTime = (Date.now() - this.gameStartTime) / 1000;
      console.log(
        `🎮 Game session ended. Duration: ${sessionTime.toFixed(1)}s`
      );
      console.log(`📊 Final Score: ${this.playerScore}`);
    });

    // Example: Debug mode toggle
    globalEventDispatcher.on('component:modified', (event: any) => {
      if (event.componentType === 'Transform') {
        // Users can track position changes, implement replay systems, etc.
      }
    });
  }
}

const createExtensibleDemo = () => {
  const engine = new GameEngine({ targetFPS: 60 });

  // Add core systems
  engine.addSystem(new ServerInputSystem());
  engine.addSystem(new PlayerControlSystem());
  engine.addSystem(new MovementSystem());
  engine.addSystem(new CollisionSystem());
  engine.addSystem(new RenderSystem());

  // Add custom event-driven systems
  engine.addSystem(new HealthSystem());
  engine.addSystem(new ScoreSystem());

  // Initialize custom game logic
  const customLogic = new CustomGameLogic();

  // Create game entities with collision
  const player = engine.createEntity();
  engine.addComponent(player.id, createTransform(400, 300));
  engine.addComponent(player.id, createVelocity(0, 0, 200));
  engine.addComponent(player.id, createInput());
  engine.addComponent(player.id, createPlayerController(150, 400, 300));
  engine.addComponent(
    player.id,
    createRenderable('rectangle', 30, 30, '#4CAF50')
  );
  engine.addComponent(
    player.id,
    createCollider(30, 30, CollisionLayers.PLAYER)
  );

  // Create some enemies
  for (let i = 0; i < 3; i++) {
    const enemy = engine.createEntity();
    engine.addComponent(
      enemy.id,
      createTransform(200 + i * 200, 100 + i * 100)
    );
    engine.addComponent(enemy.id, createVelocity((i + 1) * 30, (i + 1) * 20));
    engine.addComponent(
      enemy.id,
      createRenderable('circle', 20, 20, '#FF5722')
    );
    engine.addComponent(
      enemy.id,
      createCollider(20, 20, CollisionLayers.ENEMY)
    );
  }

  // Create pickups (triggers)
  for (let i = 0; i < 5; i++) {
    const pickup = engine.createEntity();
    engine.addComponent(pickup.id, createTransform(100 + i * 150, 200));
    engine.addComponent(
      pickup.id,
      createRenderable('circle', 12, 12, '#FFD700')
    );
    engine.addComponent(
      pickup.id,
      createCollider(12, 12, CollisionLayers.PICKUP, { isTrigger: true })
    );
  }

  console.log('🔧 Extensible Game Engine Demo Started!');
  console.log('');
  console.log(
    'This demo shows how users can extend the engine through events:'
  );
  console.log('• Custom scoring system triggered by pickups');
  console.log('• Performance monitoring and warnings');
  console.log('• Achievement system based on score');
  console.log('• Entity lifecycle tracking');
  console.log('• System performance profiling');
  console.log('');
  console.log('🎮 Controls: WASD to move, Space for info, Escape to quit');
  console.log('');

  return { engine, player, customLogic };
};

const runExtensibleDemo = () => {
  const { engine, player } = createExtensibleDemo();

  // Handle input
  globalInputHandler.addListener((keyState) => {
    if (keyState.space) {
      // Emit custom event that users can listen to
      globalEventDispatcher.emit({
        type: 'player:info_requested',
        entityId: player.id,
        timestamp: Date.now(),
      });
    }

    if (keyState.escape) {
      console.log('\n👋 Extensible demo stopping...');
      globalInputHandler.cleanup();
      engine.stop();
      process.exit(0);
    }
  });

  // Example of runtime event listener addition
  globalEventDispatcher.on('player:info_requested', () => {
    const transform = engine.getComponent(player.id, 'Transform') as any;
    const velocity = engine.getComponent(player.id, 'Velocity') as any;
    console.log(
      `\n📊 Player Status: Position(${Math.round(transform.position.x)}, ${Math.round(transform.position.y)}) Speed: ${Math.round(Math.sqrt(velocity.velocity.x ** 2 + velocity.velocity.y ** 2))}`
    );
  });

  engine.start();

  // Cleanup after demo
  setTimeout(() => {
    console.log('\n⏰ Demo timeout - showing extensibility power!');
    engine.stop();
    process.exit(0);
  }, 30000);
};

// Run demo if this is the main module
if (import.meta.main) {
  runExtensibleDemo();
}

export { createExtensibleDemo, runExtensibleDemo };
