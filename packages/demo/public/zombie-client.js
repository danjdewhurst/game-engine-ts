// Zombie Survival Game Client - Canvas Renderer with WebSocket
class ZombieGameClient {
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
      console.log('Connected to zombie survival server');
      this.updateStatus('connected', 'Connected to server');
      this.sendPlayerJoin();
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.handleServerMessage(data);
      } catch (e) {
        console.error('Failed to parse server message:', e);
      }
    };

    this.ws.onclose = () => {
      console.log('Disconnected from server');
      this.updateStatus('disconnected', 'Disconnected from server');

      // Try to reconnect after 3 seconds
      setTimeout(() => {
        if (this.ws.readyState === WebSocket.CLOSED) {
          this.setupWebSocket();
        }
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
      this.handleKeyDown(e);
    });

    document.addEventListener('keyup', (e) => {
      this.handleKeyUp(e);
    });

    // Prevent context menu on canvas
    this.canvas.addEventListener('contextmenu', (e) => {
      e.preventDefault();
    });

    // Focus canvas for input
    this.canvas.setAttribute('tabindex', '0');
    this.canvas.focus();
  }

  handleKeyDown(e) {
    const prevKeys = { ...this.keys };

    switch (e.key.toLowerCase()) {
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
        e.preventDefault(); // Prevent page scroll
        break;
      case 'r':
        this.respawnPlayer();
        break;
    }

    // Send input if changed
    if (this.inputChanged(prevKeys, this.keys)) {
      this.sendInput();
    }
  }

  handleKeyUp(e) {
    const prevKeys = { ...this.keys };

    switch (e.key.toLowerCase()) {
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
    if (this.inputChanged(prevKeys, this.keys)) {
      this.sendInput();
    }
  }

  inputChanged(prev, current) {
    return (
      prev.up !== current.up ||
      prev.down !== current.down ||
      prev.left !== current.left ||
      prev.right !== current.right ||
      prev.space !== current.space
    );
  }

  sendPlayerJoin() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: 'player:join',
          playerId: this.playerId,
        })
      );
    }
  }

  sendInput() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: 'input',
          playerId: this.playerId,
          keys: this.keys,
          timestamp: Date.now(),
        })
      );
    }
  }

  respawnPlayer() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: 'player:respawn',
          playerId: this.playerId,
        })
      );
    }
  }

  sendPing() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.lastPingTime = Date.now();
      this.ws.send(
        JSON.stringify({
          type: 'ping',
          timestamp: this.lastPingTime,
        })
      );
    }
  }

  handleServerMessage(data) {
    switch (data.type) {
      case 'gameState':
        this.gameState = data.data || data.state;
        this.updateHealthBar();
        break;
      case 'playerJoined':
        console.log(
          `Player ${data.playerId} joined with entity ${data.entityId}`
        );
        break;
      case 'playerLeft':
        console.log(`Player ${data.playerId} left`);
        break;
      case 'error':
        console.error('Server error:', data.message);
        break;
      case 'pong':
        this.ping = Date.now() - this.lastPingTime;
        break;
      default:
        console.log('Unknown message type:', data.type);
    }
  }

  updateHealthBar() {
    if (!this.gameState) return;

    // Find player's health data from game state
    let playerHealth = 100;
    let maxHealth = 100;

    for (const entity of this.gameState.entities) {
      // Look for entities with health data and renderable (likely players)
      if (
        entity.health &&
        entity.renderable &&
        entity.renderable.color === '#4CAF50'
      ) {
        playerHealth = entity.health.health;
        maxHealth = entity.health.maxHealth;
        break; // Use first player found
      }
    }

    const healthFill = document.getElementById('healthFill');
    const healthText = document.getElementById('healthText');

    if (healthFill && healthText) {
      const percentage = (playerHealth / maxHealth) * 100;
      healthFill.style.width = percentage + '%';
      healthText.textContent = `${playerHealth}/${maxHealth}`;
    }
  }

  startGameLoop() {
    const gameLoop = () => {
      this.render();
      requestAnimationFrame(gameLoop);
    };
    requestAnimationFrame(gameLoop);

    // Send ping every 2 seconds
    setInterval(() => {
      this.sendPing();
    }, 2000);
  }

  render() {
    // Clear canvas
    this.ctx.fillStyle = '#0a0a0a';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    if (!this.gameState || !this.gameState.entities) {
      // Show loading message
      this.ctx.fillStyle = '#ffffff';
      this.ctx.font = '24px Courier New';
      this.ctx.fillText(
        'Waiting for game state...',
        this.canvas.width / 2,
        this.canvas.height / 2
      );
      return;
    }

    // Sort entities by layer (render order)
    const entities = [...this.gameState.entities].sort((a, b) => {
      const aLayer = a.renderable?.layer || 0;
      const bLayer = b.renderable?.layer || 0;
      return aLayer - bLayer;
    });

    // Render entities
    for (const entity of entities) {
      this.renderEntity(entity);
    }

    // Render UI elements
    this.renderUI();
  }

  renderEntity(entity) {
    if (!entity.position || !entity.renderable || !entity.renderable.visible) {
      return;
    }

    this.ctx.save();

    // Apply transform
    this.ctx.translate(entity.position.x, entity.position.y);
    this.ctx.rotate(entity.rotation);
    this.ctx.scale(entity.scale.x, entity.scale.y);

    // Apply opacity
    if (
      entity.renderable.opacity !== undefined &&
      entity.renderable.opacity < 1
    ) {
      this.ctx.globalAlpha = entity.renderable.opacity;
    }

    // Render based on shape
    this.ctx.fillStyle = entity.renderable.color;
    this.ctx.strokeStyle =
      entity.renderable.strokeColor || entity.renderable.color;

    switch (entity.renderable.shape) {
      case 'rectangle':
        this.ctx.fillRect(
          -entity.renderable.size.x / 2,
          -entity.renderable.size.y / 2,
          entity.renderable.size.x,
          entity.renderable.size.y
        );
        break;
      case 'circle':
        this.ctx.beginPath();
        this.ctx.arc(0, 0, entity.renderable.size.x / 2, 0, Math.PI * 2);
        this.ctx.fill();
        break;
    }

    // Render health bar for entities with health (zombies and players)
    if (entity.health && entity.health.health < entity.health.maxHealth) {
      this.renderHealthBar(entity.health, entity.renderable.size.x);
    }

    this.ctx.restore();
  }

  renderHealthBar(health, entityWidth) {
    const barWidth = entityWidth;
    const barHeight = 4;
    const yOffset = -(entityWidth / 2) - 10;

    // Background
    this.ctx.fillStyle = '#333333';
    this.ctx.fillRect(-barWidth / 2, yOffset, barWidth, barHeight);

    // Health fill
    const healthPercent = health.health / health.maxHealth;
    const fillWidth = barWidth * healthPercent;

    if (healthPercent > 0.6) {
      this.ctx.fillStyle = '#00ff00';
    } else if (healthPercent > 0.3) {
      this.ctx.fillStyle = '#ffff00';
    } else {
      this.ctx.fillStyle = '#ff0000';
    }

    this.ctx.fillRect(-barWidth / 2, yOffset, fillWidth, barHeight);
  }

  renderUI() {
    // Additional UI elements can go here
  }

  updateUI() {
    setInterval(() => {
      if (this.gameState) {
        // Count different entity types
        let players = 0;
        let zombies = 0;
        let total = 0;

        for (const entity of this.gameState.entities) {
          total++;
          // Note: Player/Zombie component info not available in render data
          // These counts will be inaccurate, but entities total will be correct
          if (entity.renderable && entity.renderable.color === '#4CAF50')
            players++; // Green = player
          if (entity.renderable && entity.renderable.color === '#00ff00')
            zombies++; // Green circle = zombie
        }

        document.getElementById('fps').textContent = this.gameState.fps || '--';
        document.getElementById('entities').textContent = total;
        document.getElementById('players').textContent = players;
        document.getElementById('zombies').textContent = zombies;
        document.getElementById('ping').textContent = this.ping + 'ms';
      }
    }, 100);
  }

  updateStatus(status, message) {
    const statusEl = document.getElementById('status');
    statusEl.className = `status ${status}`;
    statusEl.textContent = message;
  }
}

// Start the game when page loads
window.addEventListener('load', () => {
  new ZombieGameClient();
});
