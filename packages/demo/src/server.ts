import { GameServer } from '@game-engine/core';

const gameServer = new GameServer();

const server = Bun.serve({
  port: 3000,
  async fetch(req, server) {
    const url = new URL(req.url);

    // Serve WebSocket upgrade for /ws
    if (url.pathname === '/ws') {
      const upgraded = server.upgrade(req);
      if (!upgraded) {
        return new Response('WebSocket upgrade failed', { status: 400 });
      }
      return undefined;
    }

    // Serve static files
    if (url.pathname === '/') {
      return new Response(await Bun.file('./public/index.html').text(), {
        headers: { 'Content-Type': 'text/html' },
      });
    }

    if (url.pathname === '/client.js') {
      return new Response(await Bun.file('./public/client.js').text(), {
        headers: { 'Content-Type': 'application/javascript' },
      });
    }

    if (url.pathname === '/stats') {
      return new Response(JSON.stringify(gameServer.getStats()), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response('Not Found', { status: 404 });
  },

  websocket: {
    open(ws) {
      gameServer.handleConnection(ws);
    },

    message(ws, message) {
      gameServer.handleMessage(ws, message as string);
    },

    close(ws) {
      gameServer.handleDisconnection(ws);
    },
  },
});

console.log(`🎮 Game server running on http://localhost:${server.port}`);
console.log(`📊 Stats available at http://localhost:${server.port}/stats`);

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  gameServer.shutdown();
  server.stop();
  process.exit(0);
});
