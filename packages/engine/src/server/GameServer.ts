import type { ServerWebSocket } from 'bun';
import { GameEngine } from '../engine/GameEngine';
import {
  ServerInputSystem,
  PlayerControlSystem,
  MovementSystem,
  CollisionSystem,
  RenderSystem,
} from '../systems';
import {
  createTransform,
  createVelocity,
  createInput,
  createPlayerController,
} from '../components';
import {
  createRenderable,
  createCollider,
  CollisionLayers,
} from '../components';
import type { ClientMessage, ServerMessage } from '../components/Renderable';

interface ClientData {
  playerId: string;
  entityId: number;
  lastInputTime: number;
}

export class GameServer {
  protected engine: GameEngine;
  protected renderSystem: RenderSystem;
  protected clients = new Map<ServerWebSocket, ClientData>();
  private aiEntities: number[] = [];
  protected broadcastInterval?: Timer;

  constructor() {
    this.engine = new GameEngine({ targetFPS: 60 });
    this.renderSystem = new RenderSystem();

    this.setupSystems();
    this.createAIEntities();
    this.engine.start();
    this.startBroadcast();
  }

  protected setupSystems(): void {
    this.engine.addSystem(new ServerInputSystem());
    this.engine.addSystem(new PlayerControlSystem());
    this.engine.addSystem(new MovementSystem());
    this.engine.addSystem(new CollisionSystem());
    this.engine.addSystem(this.renderSystem);
  }

  private createAIEntities(): void {
    // Create some AI entities for visual interest
    for (let i = 0; i < 3; i++) {
      const ai = this.engine.createEntity();
      this.engine.addComponent(
        ai.id,
        createTransform(200 + i * 100, 150 + i * 80)
      );
      this.engine.addComponent(
        ai.id,
        createVelocity((i + 1) * 40, (i + 1) * 30, 120)
      );
      this.engine.addComponent(
        ai.id,
        createRenderable('circle', 15, 15, `hsl(${120 + i * 60}, 70%, 60%)`)
      );
      this.engine.addComponent(
        ai.id,
        createCollider(15, 15, CollisionLayers.ENEMY, {
          mass: 0.8,
          restitution: 0.7,
        })
      );
      this.aiEntities.push(ai.id);
    }
  }

  private startBroadcast(): void {
    this.broadcastInterval = setInterval(() => {
      const gameState = this.renderSystem.getGameState();
      if (gameState && this.clients.size > 0) {
        const message: ServerMessage = {
          type: 'gameState',
          data: gameState,
        };
        this.broadcast(message);
      }
    }, 1000 / 30); // 30 FPS broadcast rate
  }

  public handleConnection(ws: ServerWebSocket): void {
    console.log('Client connected');
  }

  public handleMessage(ws: ServerWebSocket, message: string): void {
    try {
      const data: ClientMessage = JSON.parse(message);

      switch (data.type) {
        case 'join':
          this.handlePlayerJoin(ws, data.playerId);
          break;
        case 'input':
          this.handlePlayerInput(ws, data);
          break;
        case 'leave':
          this.handlePlayerLeave(ws);
          break;
      }
    } catch (error) {
      console.error('Error parsing message:', error);
      const errorMessage: ServerMessage = {
        type: 'error',
        message: 'Invalid message format',
      };
      ws.send(JSON.stringify(errorMessage));
    }
  }

  protected createPlayerEntity(playerId: string): {
    id: number;
    components: Map<string, any>;
  } {
    // Create player entity
    const player = this.engine.createEntity();
    this.engine.addComponent(player.id, createTransform(100, 100));
    this.engine.addComponent(player.id, createVelocity(0, 0, 200));
    this.engine.addComponent(player.id, createInput());
    this.engine.addComponent(player.id, createPlayerController(150, 400, 300));
    this.engine.addComponent(
      player.id,
      createRenderable('rectangle', 25, 25, '#4CAF50')
    );
    this.engine.addComponent(
      player.id,
      createCollider(25, 25, CollisionLayers.PLAYER, {
        mass: 1.0,
        restitution: 0.3,
      })
    );

    return {
      id: player.id,
      components: new Map(), // This will be managed by the engine
    };
  }

  private handlePlayerJoin(ws: ServerWebSocket, playerId: string): void {
    const player = this.createPlayerEntity(playerId);

    // Store client data
    const clientData: ClientData = {
      playerId,
      entityId: player.id,
      lastInputTime: 0,
    };
    this.clients.set(ws, clientData);

    // Notify client
    const response: ServerMessage = {
      type: 'playerJoined',
      playerId,
      entityId: player.id,
    };
    ws.send(JSON.stringify(response));

    console.log(`Player ${playerId} joined with entity ${player.id}`);
  }

  private handlePlayerInput(ws: ServerWebSocket, data: ClientMessage): void {
    if (data.type !== 'input') return;

    const clientData = this.clients.get(ws);
    if (!clientData) return;

    // Prevent input spam
    if (data.timestamp <= clientData.lastInputTime) return;
    clientData.lastInputTime = data.timestamp;

    // Update player input
    const inputComponent = this.engine.getComponent(
      clientData.entityId,
      'Input'
    );
    if (inputComponent) {
      (inputComponent as any).keys.up = data.keys.up;
      (inputComponent as any).keys.down = data.keys.down;
      (inputComponent as any).keys.left = data.keys.left;
      (inputComponent as any).keys.right = data.keys.right;
      (inputComponent as any).keys.space = data.keys.space;
    }
  }

  private handlePlayerLeave(ws: ServerWebSocket): void {
    const clientData = this.clients.get(ws);
    if (clientData) {
      // Remove player entity
      this.engine.destroyEntity(clientData.entityId);
      this.clients.delete(ws);

      console.log(`Player ${clientData.playerId} left`);

      // Notify other clients
      const message: ServerMessage = {
        type: 'playerLeft',
        playerId: clientData.playerId,
      };
      this.broadcast(message, ws);
    }
  }

  public handleDisconnection(ws: ServerWebSocket): void {
    this.handlePlayerLeave(ws);
    console.log('Client disconnected');
  }

  protected broadcast(message: ServerMessage, exclude?: ServerWebSocket): void {
    const messageStr = JSON.stringify(message);
    for (const [client] of this.clients) {
      if (client !== exclude) {
        client.send(messageStr);
      }
    }
  }

  public getStats(): { clients: number; entities: number; fps: number } {
    const engineStats = this.engine.getStats();
    return {
      clients: this.clients.size,
      entities: engineStats.entityCount,
      fps: engineStats.fps,
    };
  }

  public shutdown(): void {
    if (this.broadcastInterval) {
      clearInterval(this.broadcastInterval);
    }
    this.engine.stop();
    console.log('Game server shut down');
  }
}
