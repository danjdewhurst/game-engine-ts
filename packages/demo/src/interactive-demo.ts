import {
  GameEngine,
  InputSystem,
  PlayerControlSystem,
  MovementSystem,
  createTransform,
  createVelocity,
  createInput,
  createPlayerController,
  globalInputHandler,
} from '@game-engine/core';

const createInteractiveDemo = () => {
  const engine = new GameEngine({ targetFPS: 60 });

  // Add systems in order
  engine.addSystem(new InputSystem());
  engine.addSystem(new PlayerControlSystem());
  engine.addSystem(new MovementSystem());

  // Create player entity
  const player = engine.createEntity();
  engine.addComponent(player.id, createTransform(50, 50));
  engine.addComponent(player.id, createVelocity(0, 0, 150)); // Max speed 150
  engine.addComponent(player.id, createInput());
  engine.addComponent(player.id, createPlayerController(120, 300, 250));

  // Create some AI entities for comparison
  const aiEntities: number[] = [];
  for (let i = 0; i < 3; i++) {
    const ai = engine.createEntity();
    engine.addComponent(ai.id, createTransform(100 + i * 80, 100 + i * 40));
    engine.addComponent(ai.id, createVelocity((i + 1) * 30, (i + 1) * 20, 100));
    aiEntities.push(ai.id);
  }

  console.log('🎮 Interactive Demo Started!');
  console.log('Controls:');
  console.log('  Arrow Keys or WASD: Move player');
  console.log('  Space: Info');
  console.log('  Escape: Quit');
  console.log('');

  return { engine, player, aiEntities };
};

const runInteractiveDemo = () => {
  const { engine, player, aiEntities } = createInteractiveDemo();

  let lastInfoTime = 0;

  // Handle special inputs
  globalInputHandler.addListener((keyState) => {
    if (keyState.space) {
      const now = Date.now();
      if (now - lastInfoTime > 1000) {
        // Throttle info display
        const playerTransform = engine.getComponent(
          player.id,
          'Transform'
        ) as any;
        const playerVelocity = engine.getComponent(
          player.id,
          'Velocity'
        ) as any;

        console.log('\n📊 Player Status:');
        console.log(
          `   Position: (${Math.round(playerTransform.position.x)}, ${Math.round(playerTransform.position.y)})`
        );
        console.log(
          `   Velocity: (${Math.round(playerVelocity.velocity.x)}, ${Math.round(playerVelocity.velocity.y)})`
        );
        console.log(
          `   Speed: ${Math.round(Math.sqrt(playerVelocity.velocity.x ** 2 + playerVelocity.velocity.y ** 2))}`
        );

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

  // Display positions periodically
  const positionLogger = setInterval(() => {
    const playerTransform = engine.getComponent(player.id, 'Transform') as any;
    const playerVelocity = engine.getComponent(player.id, 'Velocity') as any;

    console.log('\n🎯 Game State:');
    console.log(
      `   🧑‍💼 Player: (${Math.round(playerTransform.position.x)}, ${Math.round(playerTransform.position.y)}) Speed: ${Math.round(Math.sqrt(playerVelocity.velocity.x ** 2 + playerVelocity.velocity.y ** 2))}`
    );

    aiEntities.forEach((aiId, index) => {
      const transform = engine.getComponent(aiId, 'Transform') as any;
      if (transform) {
        console.log(
          `   🤖 AI ${index + 1}: (${Math.round(transform.position.x)}, ${Math.round(transform.position.y)})`
        );
      }
    });

    const stats = engine.getStats();
    console.log(
      `   ⚡ Engine: ${Math.round(stats.fps)} FPS, ${stats.entityCount} entities`
    );
    console.log('   (Press SPACE for player info, ESC to quit)');
  }, 3000);

  // Handle process termination
  process.on('SIGINT', () => {
    clearInterval(positionLogger);
    globalInputHandler.cleanup();
    engine.stop();
    console.log('\n👋 Demo stopped');
    process.exit(0);
  });

  // Stop after 2 minutes if no input
  const timeout = setTimeout(() => {
    clearInterval(positionLogger);
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

// Run interactive demo if this is the main module
if (import.meta.main) {
  runInteractiveDemo();
}

export { createInteractiveDemo, runInteractiveDemo };
