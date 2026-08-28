import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { recordReading, sweepOfflineNodes, resetNodeState } from './nodeState.js';

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
});