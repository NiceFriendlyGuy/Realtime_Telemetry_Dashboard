import mqtt from 'mqtt';
import { z } from 'zod';
import { ReadingSchema } from './schema.js';
import { testConnection, initDb, insertReading, getReadingHistory } from './db.js';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import express from 'express';
import { isAnomaly } from './anomalyDetection.js';
import { sweepOfflineNodes, recordReading, pruneStaleNodes, getAllNodes } from './nodeState.js';
import cors from 'cors';
import { evaluateReading, getActiveAlerts, dropNodeAlerts } from './alerts.js';

console.log("Backend starting...");

const PORT = Number(process.env.PORT ?? 3000);

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({server, path:'/ws' });
app.use(cors({ origin: process.env.CORS_ORIGIN ?? 'http://localhost:4200' }));


app.get('/api/readings/:nodeId/:metric', async (req, res) => {
  const { nodeId, metric } = req.params;

  const requested = Number(req.query.minutes);
  const minutes = Number.isFinite(requested)
    ? Math.min(Math.max(Math.floor(requested), 1), 1440)
    : 15;

  try {
    res.json(await getReadingHistory(nodeId, metric, minutes));
  } catch (err) {
    console.error('History query failed:', (err as Error).message);
    res.status(500).json({ error: 'Failed to load readings' });
  }
});


wss.on('connection', (socket) => {
  console.log('Dashboard client connected');

  socket.send(
    JSON.stringify({
      type: 'snapshot',
      payload: { nodes: getAllNodes(), alerts: getActiveAlerts() },
    }),
  );

  socket.on('close', () => {
    console.log('Dashboard client disconnected');
  });
});

type MessageType = 'reading' | 'alert' | 'nodeState' | 'nodeRemoved';

function broadcast(type: MessageType, payload: unknown): void {
  const message = JSON.stringify({type, payload});

  for(const socket of wss.clients) {
    if (socket.readyState === socket.OPEN) {
      socket.send(message);
    }
  }
}


testConnection()
  .then(() => initDb())
  .catch((err) => {
    console.error('Database connection failed:', err.message);
})

const client = mqtt.connect(process.env.MQTT_URL ?? 'mqtt://localhost:1883');

client.on('connect', () => {
  console.log('Connected to MQTT broker');
  client.subscribe('telemetry/+/reading', (err) => {
    if (err) {
      console.error('Subscribe error:', err.message);
    } else {
      console.log('Subscribed to telemetry/+/reading');
    }
  });
});

client.on('error', (err) => {
  console.error('MQTT connection error:', err.message);
});

client.on('message', async (topic, payload) => {
  let parsed: unknown;

  try {
    parsed = JSON.parse(payload.toString());
  } catch {
    console.warn(`Discarded non-JSON message on ${topic}`);
    return;
  }

  const result = ReadingSchema.safeParse(parsed);

  if(!result.success) {
    console.warn(`Discarded invalid reading on ${topic}:`, z.prettifyError(result.error));
    return;
  }

  const reading = result.data;
  const detectedAnomaly = isAnomaly(reading.metric, reading.value)
  const nodeState = recordReading(reading.nodeId, reading.metric, detectedAnomaly);

  const alert = evaluateReading(reading, detectedAnomaly);
  if (alert) {
    console.log(`Alert ${alert.status}: ${alert.nodeId} ${alert.metric}`);
    broadcast('alert', alert);
  }

  try {
    await insertReading(reading, detectedAnomaly);
    console.log('Saved reading:', reading, '| detectedAnomaly:', detectedAnomaly);
    broadcast('reading', { ...reading, detectedAnomaly });
    broadcast('nodeState', nodeState);
  } catch(err) {
    console.log('Failed to save reading:', (err as Error).message);
  }
});

server.listen(PORT,() => {
  console.log(`Server listening on :${PORT}`);
});

const intervalTime = 2000;

setInterval(() => {
  const changedNodes = sweepOfflineNodes();
  for (const nodeState of changedNodes) {
    broadcast('nodeState', nodeState);
  }    

  for (const nodeId of pruneStaleNodes()) {
    broadcast('nodeRemoved', { nodeId });
    for (const alert of dropNodeAlerts(nodeId)) {
      broadcast('alert', alert);
    }
  }
  
}, intervalTime);