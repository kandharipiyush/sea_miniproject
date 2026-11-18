import http from 'http';
import dotenv from 'dotenv';
import { createApp } from './app.js';
import { initDatabaseSchema } from './database/index.js';
import { setupWebRTCSignaling } from './modules/telehealth/signaling.js';

dotenv.config();

const PORT = parseInt(process.env.PORT || '5000', 10);

async function startServer() {
  try {
    await initDatabaseSchema();
    console.log('✅ Database connected and verified.');

    const app = createApp();
    const server = http.createServer(app);

    // Setup WebRTC Telehealth WebSocket signaling
    setupWebRTCSignaling(server);

    server.listen(PORT, () => {
      console.log(`\n🏥 CareNex Server running on http://localhost:${PORT}`);
      console.log(`🌐 REST API: http://localhost:${PORT}/api/health`);
      console.log(`📡 Telehealth Signaling: ws://localhost:${PORT}/ws/telehealth\n`);
    });
  } catch (err) {
    console.error('Failed to start CareNex server:', err);
    process.exit(1);
  }
}

startServer();
