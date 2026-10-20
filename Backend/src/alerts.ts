import { distanceOutsideRange } from './anomalyDetection.js';

export interface Alert {
  id: string;
  nodeId: string;
  metric: string;
  unit: string;
  status: 'active' | 'resolved';
  startedAt: string;
  resolvedAt: string | null;
  worstValue: number;
}

export interface AlertInput {
  nodeId: string;
  metric: string;
  unit: string;
  value: number;
  timestamp: string;
}

const RAISE_AFTER = 3;
const RESOLVE_AFTER = 5;

interface Tracker {
  nodeId: string;
  anomalousStreak: number;
  normalStreak: number;
  streakStart: string;
  streakWorst: number;
  alert: Alert | null;
}

const trackers = new Map<string, Tracker>();

function isWorse(metric: string, candidate: number, current: number): boolean {
  return distanceOutsideRange(metric, candidate) > distanceOutsideRange(metric, current);
}

/** Returns an alert only when something changed: it was just raised or just resolved. */
export function evaluateReading(input: AlertInput, detectedAnomaly: boolean): Alert | null {
  const key = `${input.nodeId}|${input.metric}`;
  const tracker: Tracker = trackers.get(key) ?? {
    nodeId: input.nodeId,
    anomalousStreak: 0,
    normalStreak: 0,
    streakStart: '',
    streakWorst: 0,
    alert: null,
  };
  trackers.set(key, tracker);

  if (detectedAnomaly) {
    if (tracker.anomalousStreak === 0) {
      tracker.streakStart = input.timestamp;
      tracker.streakWorst = input.value;
    } else if (isWorse(input.metric, input.value, tracker.streakWorst)) {
      tracker.streakWorst = input.value;
    }
    tracker.anomalousStreak++;
    tracker.normalStreak = 0;

    if (tracker.alert) {
      if (isWorse(input.metric, input.value, tracker.alert.worstValue)) {
        tracker.alert.worstValue = input.value;
      }
      return null;
    }

    if (tracker.anomalousStreak >= RAISE_AFTER) {
      const raised: Alert = {
        id: `${input.nodeId}:${input.metric}:${tracker.streakStart}`,
        nodeId: input.nodeId,
        metric: input.metric,
        unit: input.unit,
        status: 'active',
        startedAt: tracker.streakStart,
        resolvedAt: null,
        worstValue: tracker.streakWorst,
      };
      tracker.alert = raised;
      return { ...raised };
    }
    return null;
  }

  tracker.normalStreak++;
  tracker.anomalousStreak = 0;

  if (tracker.alert && tracker.normalStreak >= RESOLVE_AFTER) {
    const resolved: Alert = { ...tracker.alert, status: 'resolved', resolvedAt: input.timestamp };
    tracker.alert = null;
    return resolved;
  }
  return null;
}

export function getActiveAlerts(): Alert[] {
  const active: Alert[] = [];
  for (const tracker of trackers.values()) {
    if (tracker.alert) active.push({ ...tracker.alert });
  }
  return active;
}

/** Called when a node is pruned: resolves its open alerts and forgets its trackers. */
export function dropNodeAlerts(nodeId: string, timestamp = new Date().toISOString()): Alert[] {
  const resolved: Alert[] = [];
  for (const [key, tracker] of trackers) {
    if (tracker.nodeId !== nodeId) continue;
    if (tracker.alert) {
      resolved.push({ ...tracker.alert, status: 'resolved', resolvedAt: timestamp });
    }
    trackers.delete(key);
  }
  return resolved;
}

export function resetAlerts(): void {
  trackers.clear();
}