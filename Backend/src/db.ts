import { Pool } from 'pg';

const pool = new Pool({
    connectionString: 'postgres://telemetry:telemetry@localhost:5432/telemetry',
});

export async function testConnection(): Promise<void> {
    const result = await pool.query('SELECT NOW()');
    console.log('Database connected, server time:', result.rows[0].now);
}

export async function initDb(): Promise<void> {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS readings (
            time    TIMESTAMPTZ NOT NULL,
            node_id TEXT NOT NULL,
            metric  TEXT NOT NULL,
            value   DOUBLE PRECISION NOT NULL,
            unit    TEXT NOT NULL,
            anomaly BOOLEAN NOT NULL DEFAULT FALSE
        );
        `);

        console.log('Reading table ready');
}

export async function insertReading(reading: {
    nodeId: string;
    metric: string;
    value: number;
    unit: string;
    timestamp: string;
    anomaly: boolean;
}): Promise<void> {
    await pool.query(
    `INSERT INTO readings (time, node_id, metric, value, unit, anomaly)
        VALUES ($1, $2, $3, $4, $5, $6)`,
    [reading.timestamp, reading.nodeId, reading.metric, reading.value, reading.unit, reading.anomaly],
  );
}