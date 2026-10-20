import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { recordReading, sweepOfflineNodes, resetNodeState, pruneStaleNodes, getAllNodes } from './nodeState.js';

describe('nodeState', () => {
  beforeEach(() => {
    resetNodeState();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('marks a node healthy when a normal reading arrives', () => {
    const state = recordReading('sensor-01', 'Temperature', false);
    expect(state.status).toBe('healthy');
  });

  it('marks a node warning when anomaly reading arrives', () => {
    const state = recordReading('sensor-01', 'Temperature', true);
    expect(state.status).toBe('warning');
  })

  it('marks a node offline when no readings arrives for 10 seconds', () => {
    const state = recordReading('sensor-01', 'Temperature', false);
    vi.advanceTimersByTime(10001);
    sweepOfflineNodes()
    expect(state.status).toBe('offline');
  })

  it('does not mark a node offline before the threshold', () => {
    const state = recordReading('sensor-01', 'Temperature', false);
    vi.advanceTimersByTime(9_999);
    sweepOfflineNodes();
    expect(state.status).toBe('healthy');
  });

  it('does not prune a node before the threshold', () => {
    recordReading('sensor-01', 'Temperature', false);
    vi.advanceTimersByTime(59_999);
    expect(pruneStaleNodes()).toEqual([]);
  });

  it('prunes a node after the threshold and only reports it once', () => {
    recordReading('sensor-01', 'Temperature', false);
    vi.advanceTimersByTime(60_001);
    expect(pruneStaleNodes()).toEqual(['sensor-01']);
    expect(pruneStaleNodes()).toEqual([]);
  });

  it('returns every tracked node', () => {
    recordReading('sensor-01', 'Temperature', false);
    recordReading('sensor-02', 'Temperature', true);

    const all = getAllNodes();
    expect(all).toHaveLength(2);
    expect(all.map(n => n.nodeId).sort()).toEqual(['sensor-01', 'sensor-02']);
  });

  it('stays in warning while any metric is still anomalous', () => {
    recordReading('sensor-01', 'Temperature', true);
    const state = recordReading('sensor-01', 'Voltage', false);
    expect(state.status).toBe('warning');
  });

  it('returns to healthy once every anomalous metric has recovered', () => {
    recordReading('sensor-01', 'Temperature', true);
    const state = recordReading('sensor-01', 'Temperature', false);
    expect(state.status).toBe('healthy');
  });
});