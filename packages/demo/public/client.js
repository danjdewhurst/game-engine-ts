// Game Client - Canvas Renderer with WebSocket
class GameClient {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.ws = null;
    this.playerId = this.generatePlayerId();
    this.gameState = null;
    this.lastPingTime = 0;
    this.ping = 0;

    this.keys = {
      up: false,
      down: false,
      left: false,
      right: false,
      space: false,
    };

    this.init();
  }

  generatePlayerId() {
    return 'player_' + Math.random().toString(36).substr(2, 9);
  }

  init() {
    this.setupCanvas();
    this.setupWebSocket();
    this.setupInput();
    this.startGameLoop();
    this.updateUI();
  }

  setupCanvas() {
    // Set up canvas for crisp pixel art
    this.ctx.imageSmoothingEnabled = false;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
  }

  setupWebSocket() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('Connected to game server');
      this.updateStatus('connected', 'Connected to server');

      // Join the game
      this.send({
        type: 'join',
        playerId: this.playerId,
      });
    };

    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      this.handleServerMessage(message);
    };

    this.ws.onclose = () => {
      console.log('Disconnected from game server');
      this.updateStatus('disconnected', 'Disconnected from server');

      // Attempt to reconnect after 3 seconds
      setTimeout(() => {
        this.updateStatus('connecting', 'Reconnecting...');
        this.setupWebSocket();
      }, 3000);
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.updateStatus('disconnected', 'Connection error');
    };
  }

  setupInput() {
    // Keyboard input
    document.addEventListener('keydown', (e) => {
      this.handleKeyDown(e.key);
      e.preventDefault();
    });

    document.addEventListener('keyup', (e) => {
      this.handleKeyUp(e.key);
      e.preventDefault();
    });

    // Prevent context menu on canvas
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    // Handle window blur (release all keys)
    window.addEventListener('blur', () => {
      this.releaseAllKeys();
    });
  }

  handleKeyDown(key) {
    const oldKeys = { ...this.keys };

    switch (key.toLowerCase()) {
      case 'w':
      case 'arrowup':
        this.keys.up = true;
        break;
      case 's':
      case 'arrowdown':
        this.keys.down = true;
        break;
      case 'a':
      case 'arrowleft':
        this.keys.left = true;
        break;
      case 'd':
      case 'arrowright':
        this.keys.right = true;
        break;
      case ' ':
        this.keys.space = true;
        break;
      case 'f':
        this.toggleFullscreen();
        break;
      case 'r':
        this.respawn();
        break;
    }

    // Send input if changed
    if (this.hasKeysChanged(oldKeys, this.keys)) {
      this.sendInput();
    }
  }

  handleKeyUp(key) {
    const oldKeys = { ...this.keys };

    switch (key.toLowerCase()) {
      case 'w':
      case 'arrowup':
        this.keys.up = false;
        break;
      case 's':
      case 'arrowdown':
        this.keys.down = false;
        break;
      case 'a':
      case 'arrowleft':
        this.keys.left = false;
        break;
      case 'd':
      case 'arrowright':
        this.keys.right = false;
        break;
      case ' ':
        this.keys.space = false;
        break;
    }

    // Send input if changed
    if (this.hasKeysChanged(oldKeys, this.keys)) {
      this.sendInput();
    }
  }

  hasKeysChanged(oldKeys, newKeys) {
    return Object.keys(oldKeys).some((key) => oldKeys[key] !== newKeys[key]);
  }

  releaseAllKeys() {
    const hadKeys = Object.values(this.keys).some((pressed) => pressed);
    this.keys = {
      up: false,
      down: false,
      left: false,
      right: false,
      space: false,
    };

    if (hadKeys) {
      this.sendInput();
    }
  }

  sendInput() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.send({
        type: 'input',
        playerId: this.playerId,
        keys: { ...this.keys },
        timestamp: Date.now(),
      });
    }
  }

  send(message) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  handleServerMessage(message) {
    switch (message.type) {
      case 'gameState':
        this.gameState = message.data;
        this.calculatePing(message.data.timestamp);
        break;
      case 'playerJoined':
        console.log(
          `Player ${message.playerId} joined with entity ${message.entityId}`
        );
        break;
      case 'playerLeft':
        console.log(`Player ${message.playerId} left`);
        break;
      case 'error':
        console.error('Server error:', message.message);
        break;
    }
  }

  calculatePing(serverTimestamp) {
    this.ping = Date.now() - serverTimestamp;
  }

  startGameLoop() {
    const gameLoop = () => {
      this.render();
      requestAnimationFrame(gameLoop);
    };
    gameLoop();
  }

  render() {
    // Clear canvas
    this.ctx.fillStyle = '#000000';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    if (!this.gameState) {
      // Show waiting message
      this.ctx.fillStyle = '#ffffff';
      this.ctx.font = '24px monospace';
      this.ctx.fillText(
        'Waiting for game state...',
        this.canvas.width / 2,
        this.canvas.height / 2
      );
      return;
    }

    // Render entities
    for (const entity of this.gameState.entities) {
      if (!entity.renderable || !entity.renderable.visible) continue;

      this.renderEntity(entity);
    }

    // Update UI stats
    this.updateStats();
  }

  renderEntity(entity) {
    const { position, renderable } = entity;
    const { shape, size, color, opacity } = renderable;

    this.ctx.save();
    this.ctx.globalAlpha = opacity;
    this.ctx.fillStyle = color;

    const x = position.x;
    const y = position.y;
    const width = size.x;
    const height = size.y;

    switch (shape) {
      case 'rectangle':
        this.ctx.fillRect(x - width / 2, y - height / 2, width, height);
        break;

      case 'circle':
        this.ctx.beginPath();
        this.ctx.arc(x, y, width / 2, 0, 2 * Math.PI);
        this.ctx.fill();
        break;

      case 'sprite':
        // For now, render as rectangle with different color
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x - width / 2, y - height / 2, width, height);
        break;
    }

    this.ctx.restore();

    // Render entity ID for debugging
    if (this.gameState && this.gameState.entities.length < 10) {
      this.ctx.fillStyle = '#ffffff';
      this.ctx.font = '12px monospace';
      this.ctx.fillText(entity.id.toString(), x, y - height / 2 - 10);
    }
  }

  updateStats() {
    if (!this.gameState) return;

    document.getElementById('fps').textContent = Math.round(
      this.gameState.stats.fps
    );
    document.getElementById('entities').textContent =
      this.gameState.stats.entityCount;
    document.getElementById('players').textContent =
      this.gameState.entities.filter(
        (e) => e.renderable && e.renderable.shape === 'rectangle'
      ).length;
    document.getElementById('ping').textContent = `${this.ping}ms`;
  }

  updateStatus(status, message) {
    const statusEl = document.getElementById('status');
    statusEl.className = `status ${status}`;
    statusEl.textContent = message;
  }

  updateUI() {
    // Update UI every second
    setInterval(() => {
      if (this.gameState) {
        this.updateStats();
      }
    }, 1000);
  }

  toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(console.error);
    } else {
      document.exitFullscreen().catch(console.error);
    }
  }

  respawn() {
    // Leave and rejoin to respawn
    this.send({
      type: 'leave',
      playerId: this.playerId,
    });

    setTimeout(() => {
      this.send({
        type: 'join',
        playerId: this.playerId,
      });
    }, 100);
  }
}

// Start the game client when page loads
document.addEventListener('DOMContentLoaded', () => {
  new GameClient();
});
