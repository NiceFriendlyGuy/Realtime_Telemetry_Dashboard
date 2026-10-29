import { Pool } from 'pg';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL ?? 'postgres://telemetry:telemetry@localhost:5432/telemetry',
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
            anomaly BOOLEAN NOT NULL DEFAULT FALSE,
            detected_anomaly BOOLEAN NOT NULL DEFAULT FALSE
        );
        `);


    await pool.query(`
            SELECT create_hypertable('readings', 'time', if_not_exists => TRUE, migrate_data => TRUE);
        `);
    await pool.query(`
        SELECT set_chunk_time_interval('readings', INTERVAL '1 day');
        `);
    await pool.query(`
        SELECT add_retention_policy('readings', INTERVAL '3 days', if_not_exists => TRUE);
        `);
    await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_readings_node_metric_time ON readings (node_id, metric, time DESC);
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
    },
    detectedAnomaly: boolean): Promise<void> {
    await pool.query(
        `INSERT INTO readings (time, node_id, metric, value, unit, anomaly, detected_anomaly)
            VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [reading.timestamp, reading.nodeId, reading.metric, reading.value, reading.unit, reading.anomaly, detectedAnomaly],
    );
}

export async function getReadingHistory(nodeId: string, metric: string, minutes: number) {
  const { rows } = await pool.query(
    `SELECT time, value, anomaly, detected_anomaly AS "detectedAnomaly"
     FROM readings
     WHERE node_id = $1 AND metric = $2 AND time > NOW() - make_interval(mins => $3::int)
     ORDER BY time ASC`,
    [nodeId, metric, minutes],
  );
  return rows;
}