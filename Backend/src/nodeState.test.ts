import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { recordReading, sweepOfflineNodes, resetNodeState, pruneStaleNodes } from './nodeState.js';

describe('nodeState', () => {
  beforeEach(() => {
    resetNodeState();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('marks a node healthy when a normal reading arrives', () => {
    const state = recordReading('sensor-01', false);
    expect(state.status).toBe('healthy');
  });

  it('marks a node warning when anomaly reading arrives', () => {
    const state = recordReading('sensor-01', true);
    expect(state.status).toBe('warning');
  })

  it('marks a node offline when no readings arrives for 10 seconds', () => {
    const state = recordReading('sensor-01', false);
    vi.advanceTimersByTime(10001);
    sweepOfflineNodes()
    expect(state.status).toBe('offline');
  })

  it('does not mark a node offline before the threshold', () => {
    const state = recordReading('sensor-01', false);
    vi.advanceTimersByTime(9_999);
    sweepOfflineNodes();
    expect(state.status).toBe('healthy');
  });

  it('does not prune a node before the threshold', () => {
    recordReading('sensor-01', false);
    vi.advanceTimersByTime(59_999);
    expect(pruneStaleNodes()).toEqual([]);
  });

  it('prunes a node after the threshold and only reports it once', () => {
    recordReading('sensor-01', false);
    vi.advanceTimersByTime(60_001);
    expect(pruneStaleNodes()).toEqual(['sensor-01']);
    expect(pruneStaleNodes()).toEqual([]);
  });
});