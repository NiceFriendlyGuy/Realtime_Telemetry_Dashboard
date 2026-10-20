import mqtt from 'mqtt';
import { createSimulator } from './simulator.js';

const client = mqtt.connect(process.env.MQTT_URL ?? 'mqtt://localhost:1883');

client.on('connect', () => {
  console.log('Connected to MQTT broker');
});

client.on('error', (err) => {
  console.error('MQTT connection error:', err.message);
});

console.log("Devices-Simulator starting...");

const nextReadings = createSimulator();


setInterval(() => {
  for (const reading of nextReadings()) {
    const topic = `telemetry/${reading.nodeId}/reading`;
    client.publish(topic, JSON.stringify(reading));
    console.log(`[${reading.nodeId}] ${reading.metric}: ${reading.value.toFixed(2)} ${reading.unit}`);
  }
}, 2000);
