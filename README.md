# Realtime Telemetry Dashboard

A simulated distributed sensor network exploring the same architectural patterns used in industrial/scientific data acquisition (DAQ) systems: independent devices publishing telemetry over MQTT, ingested and validated by a central service, persisted as time-series data, and streamed live over WebSocket.

**Status: work in progress.** The full data pipeline — from simulated sensor to live browser connection — is working end to end. The frontend does not yet render any UI; it currently just logs incoming data to the console. See [Current state](#current-state) and [Roadmap](#roadmap) below for exactly what's built and what isn't.

## What's working right now

```
Devices-Simulator  →  Mosquitto (MQTT)  →  Backend  →  TimescaleDB
                                              │
                                              └──→  WebSocket  →  Frontend
```

1. **Devices-Simulator** generates a simulated temperature reading every few seconds — a bounded random walk (drift + noise) with occasional anomaly spikes, rather than pure randomness, so the data behaves like a real sensor.
2. It publishes each reading as JSON to an MQTT topic (`telemetry/{nodeId}/reading`) via Mosquitto.
3. **Backend** subscribes to all device topics (`telemetry/+/reading`), safely parses each incoming payload, and validates its shape at runtime with Zod before trusting it — malformed messages are logged and discarded, not allowed to propagate.
4. Valid readings are persisted to **TimescaleDB** (PostgreSQL) via parameterized queries.
5. Valid readings are also broadcast immediately over a **WebSocket** connection, wrapped in a typed envelope (`{ type: 'reading', payload: {...} }`) so future message types (alerts, node status) can be distinguished later.
6. **Frontend** (Angular) opens a WebSocket connection to Backend and receives this live stream — currently logged to the browser console as proof the pipeline works, with no UI built on top of it yet.

## Tech stack

| Layer | Technology |
|---|---|
| Sensor simulation | Node.js, TypeScript |
| Messaging | MQTT (Eclipse Mosquitto) |
| Backend | Node.js, Express, TypeScript |
| Validation | Zod |
| Database | TimescaleDB (PostgreSQL 18) |
| Real-time transport | WebSocket (`ws`) |
| Frontend | Angular 22 (standalone) |
| Containerization | Docker, Docker Compose |


## Running it locally

Requires [Docker](https://www.docker.com/) and Node.js (LTS).

**1. Start the broker and database:**
```bash
docker compose up mosquitto timescaledb
```

**2. In separate terminals, run each service in dev mode:**
```bash
cd Backend && npm install && npm run dev
cd Devices-Simulator && npm install && npm run dev
cd Frontend && npm install && npm start
```

**3. Open the frontend** at `http://localhost:4200` and check the browser dev console — you should see a WebSocket connection log followed by a stream of incoming readings.

You can also verify each layer independently:
- Raw MQTT traffic: `docker compose exec mosquitto mosquitto_sub -t "telemetry/+/reading"`
- Persisted rows: `docker compose exec timescaledb psql -U telemetry -d telemetry -c "SELECT * FROM readings ORDER BY time DESC LIMIT 5;"`
- Backend health/WebSocket: connect manually from a browser console with `new WebSocket('ws://localhost:3000/ws')`

### Running the full stack via Docker Compose

Only `Devices-Simulator` is currently containerized and wired into `docker-compose.yml`. Running `docker compose up` will start Mosquitto, TimescaleDB, and the simulator together — Backend and Frontend are not yet part of the Compose stack (see Roadmap).

## Current state

- ✅ Devices-Simulator: typed, containerized, publishes realistic simulated readings over MQTT
- ✅ Backend: MQTT subscribe, runtime validation (Zod), TimescaleDB persistence, WebSocket broadcast with a typed message envelope
- ✅ Frontend: Angular 22 app, live WebSocket connection to Backend, receiving data (console-logged only)
- ⬜ Frontend UI — no dashboard/visualization built yet
- ⬜ Node health tracking (online/warning/offline) — not implemented yet
- ⬜ Alerts surfaced anywhere outside the raw `anomaly` flag on a reading
- ⬜ Only a single simulated device running — no multi-device scaling tested yet
- ⬜ Backend and Frontend not yet containerized / added to `docker-compose.yml`
- ⬜ No CI pipeline yet
- ⬜ No automated tests yet

## Roadmap

- [ ] Render live readings and node status in the Angular UI
- [ ] Track per-node health (last-seen heartbeat → healthy/warning/offline)
- [ ] Surface anomalies as a dedicated alert stream in the UI
- [ ] Run multiple simulated devices concurrently (`docker compose up --scale`)
- [ ] Add Dockerfiles for Backend and Frontend, wire full stack into `docker-compose.yml`
- [ ] Add GitHub Actions for lint/build
- [ ] Add a historical query view (REST endpoint + time-range chart)
- [ ] Write ADRs documenting key architectural decisions

## Key design decisions so far

- **MQTT over raw HTTP for device ingestion** — devices hold a single persistent connection and publish lightweight messages, and are fully decoupled from Backend (neither needs to know the other exists, only the broker)
- **Runtime validation (Zod) at the MQTT boundary** — TypeScript types don't exist at runtime; any data arriving from outside the process is validated for real before being trusted or persisted
- **Parameterized SQL queries** — all database writes use placeholders (`$1`, `$2`, ...) rather than string concatenation, to eliminate SQL injection risk from device-originated data
- **A typed WebSocket envelope (`{ type, payload }`)** rather than broadcasting raw readings — anticipates multiple future message types (alerts, node status) needing to coexist on the same connection
