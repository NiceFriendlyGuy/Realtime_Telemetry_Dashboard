import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { RESOLVED_ALERT_TTL_MS, TelemetrySocket } from './telemetry-socket';
import type { Alert } from '../models/telemetry';

class FakeWebSocket {
  static instances: FakeWebSocket[] = [];
  static readonly OPEN = 1;

  readyState = 0;
  url: string;
  onopen: (() => void) | null = null;
  onclose: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;

  constructor(url: string) {
    this.url = url;
    FakeWebSocket.instances.push(this);
  }

  close(): void {
    this.readyState = 3;
  }
}

function makeAlert(overrides: Partial<Alert> = {}): Alert {
  return {
    id: 'sensor-a:Temperature:t1',
    nodeId: 'sensor-a',
    metric: 'Temperature',
    unit: 'C',
    status: 'active',
    startedAt: 't1',
    resolvedAt: null,
    worstValue: 38,
    ...overrides,
  };
}

describe('TelemetrySocket alerts', () => {
  let service: TelemetrySocket;

  function deliver(alert: Alert): void {
    const socket = FakeWebSocket.instances.at(-1);
    socket?.onmessage?.({ data: JSON.stringify({ type: 'alert', payload: alert }) });
  }

  beforeEach(() => {
    vi.useFakeTimers();
    FakeWebSocket.instances = [];
    vi.stubGlobal('WebSocket', FakeWebSocket);
    service = TestBed.inject(TelemetrySocket);
    service.connect();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('keeps an active alert indefinitely', () => {
    deliver(makeAlert());
    vi.advanceTimersByTime(10 * 60_000);
    expect(service.alertFeed()).toHaveLength(1);
  });

  it('removes a resolved alert after the retention period, not before', () => {
    deliver(makeAlert({ status: 'resolved', resolvedAt: 't2' }));

    vi.advanceTimersByTime(RESOLVED_ALERT_TTL_MS - 1);
    expect(service.alertFeed()).toHaveLength(1);

    vi.advanceTimersByTime(1);
    expect(service.alertFeed()).toHaveLength(0);
  });

  it('removes only the resolved alert and keeps the others', () => {
    deliver(makeAlert({ id: 'a', status: 'active' }));
    deliver(makeAlert({ id: 'b', status: 'resolved', resolvedAt: 't2' }));

    vi.advanceTimersByTime(RESOLVED_ALERT_TTL_MS);
    expect(service.alertFeed().map((a) => a.id)).toEqual(['a']);
  });

  it('replaces the active entry when the same alert resolves', () => {
    deliver(makeAlert({ id: 'a', status: 'active' }));
    deliver(makeAlert({ id: 'a', status: 'resolved', resolvedAt: 't2' }));

    expect(service.alertFeed()).toHaveLength(1);
    expect(service.alertFeed()[0]?.status).toBe('resolved');
  });
});