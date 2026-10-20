export interface NodeState {
  nodeId: string;
  lastSeen: string;
  status: 'healthy' | 'warning' | 'offline';
}

const nodes = new Map<string, NodeState>();
const OFFLINE_THRESHOLD_MS = 10_000;
const PRUNE_AFTER_MS = 60_000;

const anomalousMetrics = new Map<string, Set<string>>();


export function getAllNodes(): NodeState[] {
  return Array.from(nodes.values());
}

export function recordReading(nodeId: string, metric: string, anomaly: boolean): NodeState {
  const state: NodeState = nodes.get(nodeId) ?? { nodeId, lastSeen: '', status: 'healthy' };

  const flagged = anomalousMetrics.get(nodeId) ?? new Set<string>();
  if (anomaly) {
    flagged.add(metric);
  } else {
    flagged.delete(metric);
  }
  anomalousMetrics.set(nodeId, flagged);

  state.lastSeen = new Date().toISOString();
  state.status = flagged.size > 0 ? 'warning' : 'healthy';

  nodes.set(nodeId, state);
  return state;
}

export function sweepOfflineNodes(): NodeState[] {
  const now = Date.now();
  const changed: NodeState[] = [];

  for (const state of nodes.values()) {
    const age = now - new Date(state.lastSeen).getTime();

    if (age > OFFLINE_THRESHOLD_MS && state.status !== 'offline') {
      state.status = 'offline';
      changed.push(state);
    }
  }

  return changed;
}

export function resetNodeState(): void {
  nodes.clear();
  anomalousMetrics.clear();
}

export function pruneStaleNodes(): string[] {
  const now = Date.now();
  const removed: string[] = [];

  for (const [nodeId, state] of nodes) {
    const age = now - new Date(state.lastSeen).getTime();
    if (age > PRUNE_AFTER_MS) {
      nodes.delete(nodeId);
      anomalousMetrics.delete(nodeId);
      removed.push(nodeId);
    }
  }

  return removed;
}