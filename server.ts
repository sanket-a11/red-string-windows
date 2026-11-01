/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Project Red String - Full-Stack Express Server with Ephemeral WebRTC Signaling Conduit
 */

import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '20mb' }));

// Ephemeral in-memory WebRTC signaling & message routing
interface SignalMessage {
  id: string;
  senderId: string;
  recipientId: string;
  type: string;
  payload: any;
  timestamp: number;
}

const signalingQueues: Record<string, SignalMessage[]> = {};

// Clean up old messages older than 2 minutes
setInterval(() => {
  const cutoff = Date.now() - 120000;
  for (const key of Object.keys(signalingQueues)) {
    signalingQueues[key] = signalingQueues[key].filter((m) => m.timestamp > cutoff);
    if (signalingQueues[key].length === 0) {
      delete signalingQueues[key];
    }
  }
}, 30000);

// Endpoint to post a signaling message (offer, answer, ICE candidate, or direct frame payload)
app.post('/api/signal/send', (req, res) => {
  const { sessionId, senderId, recipientId, type, payload } = req.body;
  if (!sessionId || !recipientId) {
    res.status(400).json({ error: 'sessionId and recipientId are required' });
    return;
  }

  const queueKey = `${sessionId}:${recipientId}`;
  if (!signalingQueues[queueKey]) {
    signalingQueues[queueKey] = [];
  }

  const msg: SignalMessage = {
    id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    senderId,
    recipientId,
    type,
    payload,
    timestamp: Date.now(),
  };

  signalingQueues[queueKey].push(msg);
  res.json({ ok: true, messageId: msg.id });
});

// Endpoint to poll signaling messages for a specific client
app.get('/api/signal/poll', (req, res) => {
  const sessionId = req.query.sessionId as string;
  const clientId = req.query.clientId as string;

  if (!sessionId || !clientId) {
    res.status(400).json({ error: 'sessionId and clientId are required' });
    return;
  }

  const queueKey = `${sessionId}:${clientId}`;
  const messages = signalingQueues[queueKey] || [];
  signalingQueues[queueKey] = []; // Drain queue
  res.json({ messages });
});

// Endpoint to detect local LAN IP addresses for mobile pairing on localhost
app.get('/api/network/ip', (_req, res) => {
  const interfaces = os.networkInterfaces();
  const ips: string[] = [];

  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      // Collect non-internal IPv4 addresses
      if (iface.family === 'IPv4' && !iface.internal) {
        ips.push(iface.address);
      }
    }
  }

  res.json({
    ips,
    primaryIp: ips[0] || 'localhost',
    port: PORT,
  });
});

async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    // Mount Vite dev server middleware in dev mode
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
        watch: process.env.DISABLE_HMR === 'true' ? null : {},
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Red String] Full-stack engine running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[Red String] Failed to start server:', err);
  process.exit(1);
});
