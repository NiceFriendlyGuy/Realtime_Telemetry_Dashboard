import mqtt from 'mqtt';
import { z } from 'zod';
import { ReadingSchema } from './schema.js';
import { testConnection, initDb, insertReading} from './db.js';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import express from 'express';

console.log("Backend starting...");

const PORT = Number(process.env.PORT ?? 3000);

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({server, path:'/ws' });


wss.on('connection', (socket) => {
  console.log('Dashboard client connected');

  socket.on('close', () => {
    console.log('Dashboard client disconnected');
  });
});

type MessageType = 'reading' | 'alert' | 'nodeState';

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
  try {
    await insertReading(reading);
    console.log('Saved reading:', reading);
    broadcast('reading', reading);
  } catch(err) {
    console.log('Failed to save reading:', (err as Error).message);
  }
});

server.listen(PORT,() => {
  console.log(`Server listening on :${PORT}`);
});