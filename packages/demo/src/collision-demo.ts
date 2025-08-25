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
  globalInputHandler,
} from '@game-engine/core';

const createCollisionDemo = () => {
  const engine = new GameEngine({ targetFPS: 60 });
  const collisionSystem = new CollisionSystem();

  // Add systems
  engine.addSystem(new ServerInputSystem());
  engine.addSystem(new PlayerControlSystem());
  engine.addSystem(new MovementSystem());
  engine.addSystem(collisionSystem);
  engine.addSystem(new RenderSystem());

  // Create player entity (green rectangle)
  const player = engine.createEntity();
  engine.addComponent(player.id, createTransform(100, 300));
  engine.addComponent(player.id, createVelocity(0, 0, 200));
  engine.addComponent(player.id, createInput());
  engine.addComponent(player.id, createPlayerController(150, 400, 300));
  engine.addComponent(
    player.id,
    createRenderable('rectangle', 30, 30, '#4CAF50')
  );
  engine.addComponent(
    player.id,
    createCollider(30, 30, CollisionLayers.PLAYER, {
      mass: 1.0,
      restitution: 0.3,
      friction: 0.1,
    })
  );

  // Create bouncing balls
  const balls: number[] = [];
  for (let i = 0; i < 5; i++) {
    const ball = engine.createEntity();
    const x = 200 + Math.random() * 400;
    const y = 100 + Math.random() * 200;
    const vx = (Math.random() - 0.5) * 200;
    const vy = (Math.random() - 0.5) * 200;

    engine.addComponent(ball.id, createTransform(x, y));
    engine.addComponent(ball.id, createVelocity(vx, vy, 150));
    engine.addComponent(
      ball.id,
      createRenderable('circle', 20, 20, `hsl(${i * 60 + 180}, 70%, 60%)`)
    );
    engine.addComponent(
      ball.id,
      createCollider(20, 20, CollisionLayers.ENEMY, {
        mass: 0.8,
        restitution: 0.9,
        friction: 0.05,
      })
    );

    balls.push(ball.id);
  }

  // Create walls around the screen
  const walls: number[] = [];

  // Top wall
  const topWall = engine.createEntity();
  engine.addComponent(topWall.id, createTransform(400, 25));
  engine.addComponent(
    topWall.id,
    createRenderable('rectangle', 800, 50, '#666666')
  );
  engine.addComponent(
    topWall.id,
    createCollider(800, 50, CollisionLayers.WALL, {
      isStatic: true,
      mass: 100,
      restitution: 0.8,
    })
  );
  walls.push(topWall.id);

  // Bottom wall
  const bottomWall = engine.createEntity();
  engine.addComponent(bottomWall.id, createTransform(400, 575));
  engine.addComponent(
    bottomWall.id,
    createRenderable('rectangle', 800, 50, '#666666')
  );
  engine.addComponent(
    bottomWall.id,
    createCollider(800, 50, CollisionLayers.WALL, {
      isStatic: true,
      mass: 100,
      restitution: 0.8,
    })
  );
  walls.push(bottomWall.id);

  // Left wall
  const leftWall = engine.createEntity();
  engine.addComponent(leftWall.id, createTransform(25, 300));
  engine.addComponent(
    leftWall.id,
    createRenderable('rectangle', 50, 600, '#666666')
  );
  engine.addComponent(
    leftWall.id,
    createCollider(50, 600, CollisionLayers.WALL, {
      isStatic: true,
      mass: 100,
      restitution: 0.8,
    })
  );
  walls.push(leftWall.id);

  // Right wall
  const rightWall = engine.createEntity();
  engine.addComponent(rightWall.id, createTransform(775, 300));
  engine.addComponent(
    rightWall.id,
    createRenderable('rectangle', 50, 600, '#666666')
  );
  engine.addComponent(
    rightWall.id,
    createCollider(50, 600, CollisionLayers.WALL, {
      isStatic: true,
      mass: 100,
      restitution: 0.8,
    })
  );
  walls.push(rightWall.id);

  // Create some pickups
  const pickups: number[] = [];
  for (let i = 0; i < 3; i++) {
    const pickup = engine.createEntity();
    const x = 150 + i * 250;
    const y = 200 + (i % 2) * 200;

    engine.addComponent(pickup.id, createTransform(x, y));
    engine.addComponent(
      pickup.id,
      createRenderable('circle', 15, 15, '#FFD700')
    );
    engine.addComponent(
      pickup.id,
      createCollider(15, 15, CollisionLayers.PICKUP, {
        isTrigger: true,
        mass: 0.1,
      })
    );

    pickups.push(pickup.id);
  }

  // Add collision event listeners
  let pickupsCollected = 0;

  collisionSystem.addEventListener('collision', (event) => {
    if (
      event.collision.entityA === player.id ||
      event.collision.entityB === player.id
    ) {
      console.log('🎯 Player collision!');
    }
  });

  collisionSystem.addEventListener('trigger', (event) => {
    const pickupId =
      event.collision.entityA === player.id
        ? event.collision.entityB
        : event.collision.entityB === player.id
          ? event.collision.entityA
          : null;

    if (pickupId && pickups.includes(pickupId)) {
      // Remove pickup
      engine.destroyEntity(pickupId);
      pickups.splice(pickups.indexOf(pickupId), 1);
      pickupsCollected++;
      console.log(`💰 Pickup collected! Total: ${pickupsCollected}`);

      if (pickups.length === 0) {
        console.log('🎉 All pickups collected!');
      }
    }
  });

  console.log('🏓 Collision Demo Started!');
  console.log('Controls:');
  console.log('  Arrow Keys or WASD: Move green player');
  console.log('  Space: Info');
  console.log('  Escape: Quit');
  console.log('');
  console.log('🎯 Objective: Collect all golden pickups!');
  console.log('🏓 Watch the balls bounce around and collide!');
  console.log('');

  return { engine, player, balls, walls, pickups, collisionSystem };
};

const runCollisionDemo = () => {
  const { engine, player, collisionSystem } = createCollisionDemo();

  let lastInfoTime = 0;

  // Handle special inputs
  globalInputHandler.addListener((keyState) => {
    if (keyState.space) {
      const now = Date.now();
      if (now - lastInfoTime > 1000) {
        const playerTransform = engine.getComponent(
          player.id,
          'Transform'
        ) as any;
        const playerVelocity = engine.getComponent(
          player.id,
          'Velocity'
        ) as any;
        const collisionEvents = collisionSystem.getCollisionEvents();

        console.log('\n📊 Player Status:');
        console.log(
          `   Position: (${Math.round(playerTransform.position.x)}, ${Math.round(playerTransform.position.y)})`
        );
        console.log(
          `   Velocity: (${Math.round(playerVelocity.velocity.x)}, ${Math.round(playerVelocity.velocity.y)})`
        );
        console.log(`   Collisions this frame: ${collisionEvents.length}`);

        lastInfoTime = now;
      }
    }

    if (keyState.escape) {
      console.log('\n👋 Goodbye!');
      globalInputHandler.cleanup();
      process.exit(0);
    }
  });

  engine.start();

  // Display game state periodically
  const gameLogger = setInterval(() => {
    const stats = engine.getStats();
    const collisionEvents = collisionSystem.getCollisionEvents();

    console.log('\n🎮 Game State:');
    console.log(
      `   ⚡ Engine: ${Math.round(stats.fps)} FPS, ${stats.entityCount} entities`
    );
    console.log(`   💥 Collisions this frame: ${collisionEvents.length}`);
    console.log('   (Press SPACE for player info, ESC to quit)');
  }, 5000);

  // Handle process termination
  process.on('SIGINT', () => {
    clearInterval(gameLogger);
    globalInputHandler.cleanup();
    engine.stop();
    console.log('\n👋 Collision demo stopped');
    process.exit(0);
  });

  // Stop after 2 minutes if no input
  const timeout = setTimeout(() => {
    clearInterval(gameLogger);
    globalInputHandler.cleanup();
    engine.stop();
    console.log('\n⏰ Demo timed out');
    process.exit(0);
  }, 120000);

  // Clear timeout if any input is received
  globalInputHandler.addListener((keyState) => {
    if (globalInputHandler.isAnyKeyPressed()) {
      clearTimeout(timeout);
    }
  });
};

// Run collision demo if this is the main module
if (import.meta.main) {
  runCollisionDemo();
}

export { createCollisionDemo, runCollisionDemo };
