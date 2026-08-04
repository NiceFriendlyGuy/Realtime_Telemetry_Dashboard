import mqtt from 'mqtt';
import { z } from 'zod';
import { ReadingSchema } from './schema.js';

console.log("Backend starting...");

const client = mqtt.connect('mqtt://localhost:1883');

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

client.on('message', (topic, payload) => {
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

  console.log('Valid reading', reading);
});