import { ZombieSurvivalServer } from './zombie-survival';

const zombieServer = new ZombieSurvivalServer();

const server = Bun.serve({
  port: 3001,
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
      return new Response(await Bun.file('./public/zombie.html').text(), {
        headers: { 'Content-Type': 'text/html' },
      });
    }

    if (url.pathname === '/zombie-client.js') {
      return new Response(await Bun.file('./public/zombie-client.js').text(), {
        headers: { 'Content-Type': 'application/javascript' },
      });
    }

    if (url.pathname === '/stats') {
      return new Response(JSON.stringify(zombieServer.getStats()), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response('Not Found', { status: 404 });
  },

  websocket: {
    open(ws) {
      zombieServer.handleConnection(ws);
    },

    message(ws, message) {
      zombieServer.handleMessage(ws, message as string);
    },

    close(ws) {
      zombieServer.handleDisconnection(ws);
    },
  },
});

console.log(
  `🧟‍♂️ Zombie Survival server running on http://localhost:${server.port}`
);
console.log(`📊 Stats available at http://localhost:${server.port}/stats`);

// Auto-shutdown after 5 minutes for testing
const shutdownTimeout = setTimeout(
  () => {
    console.log('\n⏰ Auto-shutdown timeout reached');
    zombieServer.shutdown();
    server.stop();
    process.exit(0);
  },
  5 * 60 * 1000
); // 5 minutes

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down zombie server...');
  clearTimeout(shutdownTimeout);
  zombieServer.shutdown();
  server.stop();
  process.exit(0);
});
