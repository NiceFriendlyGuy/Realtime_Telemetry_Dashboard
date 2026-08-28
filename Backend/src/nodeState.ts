export interface NodeState {
  nodeId: string;
  lastSeen: string;
  status: 'healthy' | 'warning' | 'offline';
}

const nodes = new Map<string, NodeState>();
const OFFLINE_THRESHOLD_MS = 10_000;

export function recordReading(nodeId: string, anomaly: boolean): NodeState {
  const existing = nodes.get(nodeId);

  const state: NodeState = existing ?? {
    nodeId,
    lastSeen: '',
    status: 'healthy',
  };

  state.lastSeen = new Date().toISOString();
  state.status = anomaly ? 'warning' : 'healthy';

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
}

