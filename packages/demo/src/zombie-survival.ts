import {
  GameEngine,
  GameServer,
  EntityManager,
  MovementSystem,
  RenderSystem,
  CollisionSystem,
  ServerInputSystem,
  globalEventDispatcher,
  createTransform,
  createVelocity,
  createRenderable,
  createCollider,
  createInput,
  createPlayerController,
  System,
} from '@game-engine/core';

// New Components for Zombie Survival
interface HealthComponent {
  readonly type: 'Health';
  health: number;
  maxHealth: number;
  lastDamageTime: number;
}

interface BulletComponent {
  readonly type: 'Bullet';
  damage: number;
  speed: number;
  ownerId: string;
  lifeTime: number;
  maxLifeTime: number;
}

interface ZombieComponent {
  readonly type: 'Zombie';
  targetPlayerId: string | null;
  lastDamageTime: number;
  damageInterval: number; // 2000ms = 2 seconds
}

interface PlayerComponent {
  readonly type: 'Player';
  lastDirection: { x: number; y: number };
  shootCooldown: number;
}

// Component creators
export function createHealth(health = 100): HealthComponent {
  return {
    type: 'Health',
    health,
    maxHealth: health,
    lastDamageTime: 0,
  };
}

export function createBullet(
  damage = 5,
  speed = 300,
  ownerId = ''
): BulletComponent {
  return {
    type: 'Bullet',
    damage,
    speed,
    ownerId,
    lifeTime: 0,
    maxLifeTime: 3000, // 3 seconds
  };
}

export function createZombie(): ZombieComponent {
  return {
    type: 'Zombie',
    targetPlayerId: null,
    lastDamageTime: 0,
    damageInterval: 2000, // 2 seconds
  };
}

export function createPlayer(): PlayerComponent {
  return {
    type: 'Player',
    lastDirection: { x: 1, y: 0 },
    shootCooldown: 0,
  };
}

// Shooting System
class ShootingSystem implements System {
  name = 'ShootingSystem';
  private engine!: any; // Will be set by ZombieSurvivalServer

  setEngine(engine: any): void {
    this.engine = engine;
  }

  update(deltaTime: number, entities: Map<any, any>): void {
    for (const entity of entities.values()) {
      const player = entity.components.get('Player');
      const input = entity.components.get('Input');
      const transform = entity.components.get('Transform');

      if (player && input && transform) {
        // Update shoot cooldown (convert from seconds to milliseconds)
        if (player.shootCooldown > 0) {
          player.shootCooldown -= deltaTime * 1000; // deltaTime is in seconds, cooldown in ms
        }

        // Track last movement direction (support diagonal movement)
        let directionX = 0;
        let directionY = 0;

        if (input.keys.up) directionY = -1;
        if (input.keys.down) directionY = 1;
        if (input.keys.left) directionX = -1;
        if (input.keys.right) directionX = 1;

        // Update direction if any movement keys are pressed
        if (directionX !== 0 || directionY !== 0) {
          // Normalize diagonal directions
          const length = Math.sqrt(
            directionX * directionX + directionY * directionY
          );
          player.lastDirection = {
            x: directionX / length,
            y: directionY / length,
          };
        }

        // Shoot on space key
        if (input.keys.space && player.shootCooldown <= 0) {
          this.createBullet(entity.id, transform, player);
          player.shootCooldown = 200; // 200ms cooldown
        }
      }
    }
  }

  private createBullet(
    playerId: number,
    playerTransform: any,
    player: PlayerComponent
  ): void {
    if (!this.engine) return;

    // Position bullet slightly in front of player
    const offsetX = player.lastDirection.x * 30;
    const offsetY = player.lastDirection.y * 30;

    // Create bullet entity through engine
    const bullet = this.engine.createEntity();

    this.engine.addComponent(
      bullet.id,
      createTransform(
        playerTransform.position.x + offsetX,
        playerTransform.position.y + offsetY
      )
    );

    this.engine.addComponent(
      bullet.id,
      createVelocity(player.lastDirection.x * 500, player.lastDirection.y * 500)
    );

    this.engine.addComponent(
      bullet.id,
      createRenderable('circle', 4, 4, '#ffff00')
    );
    this.engine.addComponent(bullet.id, createCollider(4, 4));
    this.engine.addComponent(
      bullet.id,
      createBullet(5, 500, playerId.toString())
    );
  }
}

// Zombie AI System
class ZombieAISystem implements System {
  name = 'ZombieAISystem';

  update(deltaTime: number, entities: Map<any, any>): void {
    for (const entity of entities.values()) {
      const zombie = entity.components.get('Zombie');
      const transform = entity.components.get('Transform');
      const velocity = entity.components.get('Velocity');

      if (zombie && transform && velocity) {
        // Find closest player
        const closestPlayer = this.findClosestPlayer(
          transform.position,
          entities
        );

        if (closestPlayer) {
          zombie.targetPlayerId = closestPlayer.id;

          // Move towards target player
          const dx = closestPlayer.transform.position.x - transform.position.x;
          const dy = closestPlayer.transform.position.y - transform.position.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance > 0) {
            const speed = 40; // Zombie speed (reduced from 80)
            velocity.velocity.x = (dx / distance) * speed;
            velocity.velocity.y = (dy / distance) * speed;
          }
        }
      }
    }
  }

  private findClosestPlayer(zombiePos: any, entities: Map<any, any>) {
    let closestPlayer = null;
    let closestDistance = Infinity;

    for (const entity of entities.values()) {
      const player = entity.components.get('Player');
      const transform = entity.components.get('Transform');

      if (player && transform) {
        const dx = transform.position.x - zombiePos.x;
        const dy = transform.position.y - zombiePos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < closestDistance) {
          closestDistance = distance;
          closestPlayer = { id: entity.id, transform };
        }
      }
    }

    return closestPlayer;
  }
}

// Bullet System
class BulletSystem implements System {
  name = 'BulletSystem';
  private engine!: any; // Will be set by ZombieSurvivalServer

  setEngine(engine: any): void {
    this.engine = engine;
  }

  update(deltaTime: number, entities: Map<any, any>): void {
    const bulletsToRemove: number[] = [];

    for (const entity of entities.values()) {
      const bullet = entity.components.get('Bullet');

      if (bullet) {
        // Update bullet lifetime
        bullet.lifeTime += deltaTime;

        // Remove expired bullets
        if (bullet.lifeTime >= bullet.maxLifeTime) {
          bulletsToRemove.push(entity.id);
        }
      }
    }

    // Remove expired bullets
    for (const bulletId of bulletsToRemove) {
      if (this.engine) {
        this.engine.destroyEntity(bulletId);
      }
    }
  }
}

// Damage System
class DamageSystem implements System {
  name = 'DamageSystem';
  private engine!: any; // Will be set by ZombieSurvivalServer

  constructor() {
    // Listen for collision events
    globalEventDispatcher.on('collision:detected', (event: any) => {
      this.handleCollision(event);
    });
  }

  setEngine(engine: any): void {
    this.engine = engine;
  }

  update(deltaTime: number, entities: Map<any, any>): void {
    if (!this.engine) return;

    // Handle zombie damage to players over time
    for (const zombieEntity of entities.values()) {
      const zombie = zombieEntity.components.get('Zombie');
      const zombieTransform = zombieEntity.components.get('Transform');

      if (zombie && zombie.targetPlayerId && zombieTransform) {
        // Find the target player entity
        for (const playerEntity of entities.values()) {
          if (playerEntity.id === zombie.targetPlayerId) {
            const playerTransform = playerEntity.components.get('Transform');
            const playerHealth = playerEntity.components.get('Health');

            if (playerTransform && playerHealth) {
              // Check if zombie is touching player
              const dx =
                playerTransform.position.x - zombieTransform.position.x;
              const dy =
                playerTransform.position.y - zombieTransform.position.y;
              const distance = Math.sqrt(dx * dx + dy * dy);

              if (
                distance < 25 &&
                Date.now() - zombie.lastDamageTime >= zombie.damageInterval
              ) {
                playerHealth.health = Math.max(0, playerHealth.health - 5);
                zombie.lastDamageTime = Date.now();

                if (playerHealth.health <= 0) {
                  // Respawn player
                  this.respawnPlayer(playerEntity);
                }
              }
            }
            break;
          }
        }
      }
    }
  }

  private handleCollision(event: any): void {
    if (!this.engine) return;

    const { entityA, entityB } = event;

    // Get entity data from engine
    const entityABullet = this.engine.getComponent(entityA, 'Bullet');
    const entityBBullet = this.engine.getComponent(entityB, 'Bullet');
    const entityAZombie = this.engine.getComponent(entityA, 'Zombie');
    const entityBZombie = this.engine.getComponent(entityB, 'Zombie');

    // Bullet hits zombie
    if (entityABullet && entityBZombie) {
      this.damageBulletToZombie(entityA, entityB);
    } else if (entityBBullet && entityAZombie) {
      this.damageBulletToZombie(entityB, entityA);
    }
  }

  private damageBulletToZombie(bulletId: number, zombieId: number): void {
    if (!this.engine) return;

    const bullet = this.engine.getComponent(bulletId, 'Bullet');
    const zombieHealth = this.engine.getComponent(zombieId, 'Health');

    if (bullet && zombieHealth) {
      // Deal damage
      zombieHealth.health -= bullet.damage;

      // Remove bullet
      this.engine.destroyEntity(bulletId);

      // Remove zombie if dead
      if (zombieHealth.health <= 0) {
        this.engine.destroyEntity(zombieId);
      }
    }
  }

  private respawnPlayer(playerEntity: any): void {
    const transform = playerEntity.components.get('Transform');
    const health = playerEntity.components.get('Health');

    if (transform && health) {
      // Reset position to center
      transform.position.x = 400;
      transform.position.y = 300;

      // Reset health
      health.health = health.maxHealth;
    }
  }
}

// Zombie Spawner System
class ZombieSpawnerSystem implements System {
  name = 'ZombieSpawnerSystem';
  private engine!: any; // Will be set by ZombieSurvivalServer
  private lastSpawnTime = 0;
  private spawnInterval = 3000; // 3 seconds

  setEngine(engine: any): void {
    this.engine = engine;
  }

  update(deltaTime: number, entities: Map<any, any>): void {
    const now = Date.now();

    if (now - this.lastSpawnTime >= this.spawnInterval) {
      this.spawnZombie();
      this.lastSpawnTime = now;
    }
  }

  private spawnZombie(): void {
    if (!this.engine) return;

    // Spawn at random edge
    const spawnPoint = this.getRandomSpawnPoint();

    // Create zombie entity through engine
    const zombie = this.engine.createEntity();

    this.engine.addComponent(
      zombie.id,
      createTransform(spawnPoint.x, spawnPoint.y)
    );
    this.engine.addComponent(zombie.id, createVelocity(0, 0));
    this.engine.addComponent(
      zombie.id,
      createRenderable('circle', 15, 15, '#00ff00')
    );
    this.engine.addComponent(zombie.id, createCollider(15, 15));
    this.engine.addComponent(zombie.id, createZombie());
    this.engine.addComponent(zombie.id, createHealth(10));
  }

  private getRandomSpawnPoint(): { x: number; y: number } {
    const side = Math.floor(Math.random() * 4);
    const canvasWidth = 800;
    const canvasHeight = 600;

    switch (side) {
      case 0: // Top
        return { x: Math.random() * canvasWidth, y: -20 };
      case 1: // Right
        return { x: canvasWidth + 20, y: Math.random() * canvasHeight };
      case 2: // Bottom
        return { x: Math.random() * canvasWidth, y: canvasHeight + 20 };
      case 3: // Left
        return { x: -20, y: Math.random() * canvasHeight };
      default:
        return { x: 100, y: 100 };
    }
  }
}

// Extended Game State type for Zombie Survival (demo-specific)
type ZombieGameState = {
  entities: Array<{
    id: number;
    position: { x: number; y: number };
    rotation: number;
    scale: { x: number; y: number };
    renderable?: {
      shape: string;
      size: { x: number; y: number };
      color: string;
      opacity: number;
      layer: number;
      visible: boolean;
      spriteUrl?: string;
    };
    health?: {
      health: number;
      maxHealth: number;
    };
  }>;
  timestamp: number;
  stats: {
    fps: number;
    entityCount: number;
    deltaTime: number;
  };
};

// Extended Game Server for Zombie Survival
export class ZombieSurvivalServer extends GameServer {
  constructor() {
    super();
    this.setupZombieGame();
  }

  protected setupSystems(): void {
    // Call parent setup first
    super.setupSystems();

    // Create and configure zombie game systems
    const shootingSystem = new ShootingSystem();
    const bulletSystem = new BulletSystem();
    const damageSystem = new DamageSystem();
    const zombieSpawnerSystem = new ZombieSpawnerSystem();

    // Set engine reference for systems that need it
    shootingSystem.setEngine(this.engine);
    bulletSystem.setEngine(this.engine);
    damageSystem.setEngine(this.engine);
    zombieSpawnerSystem.setEngine(this.engine);

    // Add zombie game systems
    this.engine.addSystem(shootingSystem);
    this.engine.addSystem(new ZombieAISystem());
    this.engine.addSystem(bulletSystem);
    this.engine.addSystem(damageSystem);
    this.engine.addSystem(zombieSpawnerSystem);
  }

  private setupZombieGame(): void {
    // Override the default broadcast to add health data
    this.setupHealthAwareBroadcast();
  }

  private setupHealthAwareBroadcast(): void {
    // Clear the default broadcast interval
    if (this.broadcastInterval) {
      clearInterval(this.broadcastInterval);
    }

    // Start custom broadcast with health data
    this.broadcastInterval = setInterval(() => {
      const baseGameState = this.renderSystem.getGameState();
      if (baseGameState && this.clients.size > 0) {
        // Extend game state with health data
        const zombieGameState = this.addHealthDataToGameState(baseGameState);

        const message = {
          type: 'gameState',
          data: zombieGameState,
        };
        this.broadcast(message);
      }
    }, 1000 / 30); // 30 FPS broadcast rate
  }

  private addHealthDataToGameState(baseGameState: any): ZombieGameState {
    // Get all entities from engine to access health components
    const allEntities = new Map<number, any>();
    this.engine.getAllEntities().forEach((entity: any) => {
      allEntities.set(entity.id, entity);
    });

    const enhancedEntities = baseGameState.entities.map((entity: any) => {
      const fullEntity = allEntities.get(entity.id);
      const healthComponent = fullEntity?.components?.get('Health');

      const enhancedEntity: any = { ...entity };

      if (healthComponent) {
        enhancedEntity.health = {
          health: healthComponent.health,
          maxHealth: healthComponent.maxHealth,
        };
      }

      return enhancedEntity;
    });

    return {
      ...baseGameState,
      entities: enhancedEntities,
    };
  }

  // Override player creation to add Player component
  protected createPlayerEntity(playerId: string): any {
    const entity = super.createPlayerEntity(playerId);

    // We need to access the actual entity from the engine to add components
    // Since the engine manages entities internally, we need to add components through the engine
    this.engine.addComponent(entity.id, createPlayer());
    this.engine.addComponent(entity.id, createHealth(100));

    // Update spawn position to center
    const transform = this.engine.getComponent(entity.id, 'Transform');
    if (transform) {
      transform.position.x = 400;
      transform.position.y = 300;
    }

    return entity;
  }

  // Override message handling to support zombie-specific messages
  public handleMessage(ws: any, message: string): void {
    try {
      const data = JSON.parse(message);

      // Handle zombie-specific message types
      switch (data.type) {
        case 'player:join':
          // Convert to standard join message
          data.type = 'join';
          super.handleMessage(ws, JSON.stringify(data));
          break;
        case 'player:respawn':
          // Handle respawn
          this.handlePlayerRespawn(ws, data.playerId);
          break;
        case 'ping':
          // Handle ping message
          ws.send(
            JSON.stringify({
              type: 'pong',
              timestamp: data.timestamp,
            })
          );
          break;
        default:
          // Pass other messages to parent
          super.handleMessage(ws, message);
          break;
      }
    } catch (error) {
      console.error('Error parsing zombie message:', error);
      super.handleMessage(ws, message); // Fallback to parent
    }
  }

  private handlePlayerRespawn(ws: any, playerId: string): void {
    // Find the player entity and reset it
    // This is a simplified implementation - in a real game you'd want to track entities properly
    console.log(`Player ${playerId} requesting respawn`);
  }
}
