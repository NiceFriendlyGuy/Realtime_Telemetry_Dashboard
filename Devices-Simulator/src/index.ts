import mqtt from 'mqtt';

const client = mqtt.connect('mqtt://localhost:1883');

client.on('connect', () => {
  console.log('Connected to MQTT broker');
});

client.on('error', (err) => {
  console.error('MQTT connection error:', err.message);
});

console.log("Devices-Simulator starting...");

let currentTemp = 22;
const SPIKE_CHANCE = 0.98;
const SPIKE_TEMP_ADDED = 15;
const BASE_LINE_PULLBACK = 0.1;
const DRIFT_STRENGTH = 0.5;
const BASELINE_TEMP = 22;
const NODE_ID:string = 'sensor-01';

interface Reading {
    nodeId: string;
    metric: string;
    unit: string;
    value: number;
    timestamp: string;
    anomaly: boolean;
}

setInterval(() => {
    const reading = getNextReading();
    const topic = `telemetry/${NODE_ID}/reading`;
    const readingString = JSON.stringify(reading);

    console.log(`[${NODE_ID}] Reading: ${reading.value.toFixed(2)}°C`);
    client.publish(topic, readingString)
    
}, 2000);

function getNextReading(): Reading {
    let anomaly = false;
    const drift = (Math.random() * 2 - 1) * DRIFT_STRENGTH;
    const pullToBaseline = (BASELINE_TEMP - currentTemp) * BASE_LINE_PULLBACK;

    currentTemp += drift + pullToBaseline;
    if(Math.random() >= SPIKE_CHANCE){
        currentTemp += SPIKE_TEMP_ADDED;
        anomaly = true;
    };
    return {nodeId:NODE_ID, metric: "Temperature", unit: "C", value: currentTemp, timestamp: new Date().toISOString(), anomaly: anomaly};
}