# Realtime Telemetry Dashboard

A simulated distributed sensor network exploring the same architectural patterns used in industrial/scientific data acquisition (DAQ) systems: independent devices publishing telemetry over MQTT, ingested and validated by a central service, persisted as time-series data, and streamed live to a monitoring dashboard.

**Status: work in progress.** The full pipeline — from simulated sensor to a live, rendered dashboard — is working end to end, including real-time node health tracking. Historical charts and richer visualization are not built yet. See [Current state](#current-state) and [Roadmap](#roadmap) for exactly what's built and what isn't.

## What's working right now

```
Devices-Simulator  →  Mosquitto (MQTT)  →  Backend  →  TimescaleDB
                                              │
                                              └──→  WebSocket  →  Frontend (live dashboard)
```

1. **Devices-Simulator** generates a simulated temperature reading every few seconds — a bounded random walk (drift + noise) with occasional injected anomaly spikes, so the data behaves like a real sensor rather than pure randomness.
2. It publishes each reading as JSON to an MQTT topic (`telemetry/{nodeId}/reading`) via Mosquitto.
3. **Backend** subscribes to all device topics (`telemetry/+/reading`), safely parses each payload, and validates its shape at runtime with Zod before trusting it — malformed messages are discarded, not propagated.
4. Backend runs its own **independent anomaly detection** on the raw value, using per-metric thresholds — it does not trust the simulator's own anomaly flag, which is instead persisted separately as a ground-truth comparison signal.
5. Backend tracks **per-node health state** in memory: every reading updates a node's status (`healthy`/`warning`), and a periodic sweep marks a node `offline` if it hasn't been heard from within a threshold window.
6. Valid readings are persisted to **TimescaleDB** via parameterized queries.
7. Readings and node-state changes are broadcast live over **WebSocket**, wrapped in a typed envelope (`{ type: 'reading' | 'nodeState', payload: {...} }`).
8. **Frontend** (Angular 22, signal-based state) receives this live stream and renders a node status grid that updates in real time — including correctly showing a node go `offline` a few seconds after it stops publishing.

## Tech stack

| Layer | Technology |
|---|---|
| Sensor simulation | Node.js, TypeScript |
| Messaging | MQTT (Eclipse Mosquitto) |
| Backend | Node.js, Express, TypeScript |
| Validation | Zod |
| Database | TimescaleDB (PostgreSQL 18) |
| Real-time transport | WebSocket (`ws`) |
| Frontend | Angular 22 (standalone, signals) |
| Testing | Vitest (Backend, Devices-Simulator) |
| Containerization | Docker, Docker Compose |
| CI | GitHub Actions (lint + build, all services) |

## Project structure

```
.
├── Devices-Simulator/
│   ├── src/
│   │   ├── simulator.ts       # Pure simulation logic (drift, noise, anomalies)
│   │   ├── simulator.test.ts
│   │   └── index.ts           # MQTT connection + publish loop
│   └── Dockerfile
├── Backend/
│   └── src/
│       ├── index.ts               # Express + WebSocket server, MQTT handling
│       ├── db.ts                  # TimescaleDB connection + queries
│       ├── schema.ts              # Zod validation schema
│       ├── schema.test.ts
│       ├── anomalyDetection.ts    # Independent threshold-based anomaly detection
│       ├── anomalyDetection.test.ts
│       ├── nodeState.ts           # In-memory node health tracking + offline sweep
│       └── nodeState.test.ts      # Fake-timer tests for the offline threshold
│   └── Dockerfile
├── Frontend/
│   └── src/app/
│       ├── app.ts
│       ├── models/telemetry.ts        # Mirrored message/state types
│       ├── services/telemetry-socket.ts   # WebSocket connection + signal-based state
│       └── components/node-grid/          # Live node status grid
│   └── Dockerfile
├── docker-compose.yml
├── .github/workflows/ci.yml
└── README.md
```

## Running it locally

Requires [Docker](https://www.docker.com/) and Node.js (LTS).

**Full stack, one command:**
```bash
docker compose up --build
```

Then open [http://localhost:4200](http://localhost:4200) — you should see the node status grid, showing `sensor-01` as healthy and updating live. Stop the `devices-simulator` container and watch it transition to `offline` after a few seconds.

**Running services individually (for active development):**
```bash
docker compose up mosquitto timescaledb
cd Backend && npm install && npm run dev
cd Devices-Simulator && npm install && npm run dev
cd Frontend && npm install && npm start
```

**Running tests:**
```bash
cd Backend && npm run test
cd Devices-Simulator && npm run test
```

**Verifying individual layers:**
- Raw MQTT traffic: `docker compose exec mosquitto mosquitto_sub -t "telemetry/+/reading"`
- Persisted rows: `docker compose exec timescaledb psql -U telemetry -d telemetry -c "SELECT node_id, value, anomaly, detected_anomaly FROM readings ORDER BY time DESC LIMIT 5;"`

## Current state

- ✅ Devices-Simulator: typed, containerized, tested, publishes realistic simulated readings
- ✅ Backend: MQTT subscribe, runtime validation (Zod), independent anomaly detection, in-memory node health tracking with offline detection, TimescaleDB persistence, WebSocket broadcast — all covered by unit tests
- ✅ Frontend: Angular 22, signal-based state, live WebSocket connection, renders a real-time node status grid
- ✅ Full stack containerized and orchestrated via `docker compose up --build`
- ✅ CI pipeline (GitHub Actions): lint + build across all three services on every push/PR
- ⬜ Live reading values (temperature, etc.) not yet displayed in the UI — only node status is rendered so far
- ⬜ No visual styling/color-coding on node status yet (healthy/warning/offline all render the same way)
- ⬜ No historical/trend charts
- ⬜ Alerts not surfaced anywhere in the UI (the underlying `detected_anomaly` signal exists, but nothing renders it yet)
- ⬜ Only a single simulated device running — no multi-device scaling tested
- ⬜ Frontend has no automated tests yet
- ⬜ No ADRs written yet

## Roadmap

- [ ] Display live reading values per node in the dashboard
- [ ] Color-code / visually distinguish node health status
- [ ] Surface anomaly alerts as a dedicated UI element
- [ ] Add a historical query view (REST endpoint + time-range chart)
- [ ] Run multiple simulated devices concurrently (`docker compose up --scale`)
- [ ] Add Frontend unit tests
- [ ] Write ADRs (e.g. container-vs-real-deployment topology, MQTT-vs-HTTP, why Redis was deliberately deferred)
- [ ] Revisit Redis if/when Backend is scaled horizontally (shared node state / pub-sub across instances)

## Key design decisions

- **MQTT over raw HTTP for device ingestion** — devices hold a single persistent connection and are fully decoupled from Backend; neither needs to know the other exists, only the broker
- **Runtime validation (Zod) at the MQTT boundary** — TypeScript types don't exist at runtime; data arriving from outside the process is validated for real before being trusted or persisted
- **Independent anomaly detection in Backend** — Backend never trusts the simulator's own anomaly flag; it computes its own judgment from raw values, with the simulator's flag kept separately as a way to validate the detector against known ground truth
- **In-memory node health state, with a separate periodic sweep for offline detection** — reacting to incoming messages alone can't detect silence; a timer-based sweep is a fundamentally different mechanism, needed specifically to catch the *absence* of data
- **Parameterized SQL queries** — all database writes use placeholders rather than string concatenation, eliminating SQL injection risk from device-originated data
- **A typed WebSocket envelope (`{ type, payload }`)** — anticipates multiple message types (readings, node state, eventually alerts) coexisting on one connection
- **Signals over RxJS for Frontend state** — Angular 22's current recommended default for synchronous, component-facing state; RxJS is reserved for genuinely async/time-based orchestration if that need arises later
- **Devices and Frontend are containerized for local development and demo convenience, not as a model of real deployment** — in production, Frontend would deploy to static hosting and real devices would run independently against a publicly reachable broker; nothing in the application code assumes otherwise, since all inter-service URLs are environment-variable configurable
