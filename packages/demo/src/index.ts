import {
  GameEngine,
  MovementSystem,
  createTransform,
  createVelocity,
} from '@game-engine/core';

const createDemoGame = () => {
  const engine = new GameEngine({ targetFPS: 60 });

  // Add systems
  engine.addSystem(new MovementSystem());

  // Create demo entities
  const entities: number[] = [];

  // Create 5 moving entities with different velocities
  for (let i = 0; i < 5; i++) {
    const entity = engine.createEntity();
    engine.addComponent(entity.id, createTransform(i * 50, i * 30));
    engine.addComponent(
      entity.id,
      createVelocity((i + 1) * 20, (i + 1) * 15, 100 + i * 50)
    );
    entities.push(entity.id);
  }

  console.log(`Demo game initialized with ${entities.length} entities`);

  return { engine, entities };
};

const runDemo = () => {
  const { engine, entities } = createDemoGame();

  engine.start();
  console.log('🎮 Demo game started!');

  // Log entity positions every 2 seconds
  const positionLogger = setInterval(() => {
    console.log('\n📍 Entity positions:');
    entities.forEach((entityId, index) => {
      const transform = engine.getComponent(entityId, 'Transform');
      if (transform) {
        console.log(
          `  Entity ${index + 1}: (${Math.round((transform as any).position.x)}, ${Math.round((transform as any).position.y)})`
        );
      }
    });
    console.log(
      `⚡ Engine stats: ${Math.round(engine.getStats().fps)} FPS, ${engine.getStats().entityCount} entities`
    );
  }, 2000);

  // Stop after 15 seconds
  setTimeout(() => {
    clearInterval(positionLogger);
    engine.stop();
    console.log('\n🛑 Demo game stopped');
    process.exit(0);
  }, 15000);
};

// Run demo if this is the main module
if (import.meta.main) {
  runDemo();
}

export { createDemoGame, runDemo };
