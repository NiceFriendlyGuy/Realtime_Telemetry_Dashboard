import mqtt from 'mqtt';
import { getNextReading } from './simulator.js';

const client = mqtt.connect(process.env.MQTT_URL ?? 'mqtt://localhost:1883');

client.on('connect', () => {
  console.log('Connected to MQTT broker');
});

client.on('error', (err) => {
  console.error('MQTT connection error:', err.message);
});

console.log("Devices-Simulator starting...");

setInterval(() => {
    const reading = getNextReading();
    const topic = `telemetry/${reading.nodeId}/reading`;
    const readingString = JSON.stringify(reading);

    console.log(`[${reading.nodeId}] Reading: ${reading.value.toFixed(2)}°C`);
    client.publish(topic, readingString)
    
}, 2000);
