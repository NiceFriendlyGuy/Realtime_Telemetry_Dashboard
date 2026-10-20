import { describe, it, expect, beforeEach } from 'vitest';
import { evaluateReading, getActiveAlerts, dropNodeAlerts, resetAlerts } from './alerts.js';

const base = { nodeId: 'sensor-01', metric: 'Temperature', unit: 'C', timestamp: 't0' };

function feed(value: number, anomaly: boolean, overrides: Partial<typeof base> = {}) {
  return evaluateReading({ ...base, ...overrides, value }, anomaly);
}

function feedAll(count: number, value: number, anomaly: boolean) {
  return Array.from({ length: count }, () => feed(value, anomaly));
}

describe('alerts', () => {
  beforeEach(() => {
    resetAlerts();
  });

  it('does not raise an alert after 2 anomalous readings', () => {
    expect(feedAll(2, 35, true).every((r) => r === null)).toBe(true);
    expect(getActiveAlerts()).toEqual([]);
  });

  it('raises an alert on the 3rd consecutive anomalous reading', () => {
    feedAll(2, 35, true);
    const alert = feed(35, true);
    expect(alert?.status).toBe('active');
    expect(getActiveAlerts()).toHaveLength(1);
  });

  it('resets the streak when a normal reading interrupts it', () => {
    feedAll(2, 35, true);
    feed(22, false);
    feedAll(2, 35, true);
    expect(getActiveAlerts()).toEqual([]);
  });

  it('starts the alert at the first anomalous reading of the streak', () => {
    feed(31, true, { timestamp: 't1' });
    feed(32, true, { timestamp: 't2' });
    const alert = feed(33, true, { timestamp: 't3' });
    expect(alert?.startedAt).toBe('t1');
  });

  it('tracks the worst value, including after the alert is raised', () => {
    feed(31, true);
    feed(38, true);
    const alert = feed(33, true);
    expect(alert?.worstValue).toBe(38);

    feed(40, true);
    expect(getActiveAlerts()[0]?.worstValue).toBe(40);
  });

  it('does not resolve after 4 normal readings but resolves after 5', () => {
    feedAll(3, 35, true);
    expect(feedAll(4, 22, false).every((r) => r === null)).toBe(true);
    expect(getActiveAlerts()).toHaveLength(1);

    expect(feed(22, false)?.status).toBe('resolved');
    expect(getActiveAlerts()).toEqual([]);
  });

  it('keeps the alert active when an anomaly interrupts recovery', () => {
    feedAll(3, 35, true);
    feedAll(4, 22, false);
    feed(35, true);

    expect(feedAll(4, 22, false).every((r) => r === null)).toBe(true);
    expect(getActiveAlerts()).toHaveLength(1);
    expect(feed(22, false)?.status).toBe('resolved');
  });

  it('tracks each metric independently', () => {
    feedAll(3, 35, true);
    feed(9, true, { metric: 'Voltage', unit: 'V' });
    feed(9, true, { metric: 'Voltage', unit: 'V' });
    expect(getActiveAlerts().map((a) => a.metric)).toEqual(['Temperature']);
  });

  it('resolves and forgets the alerts of a removed node', () => {
    feedAll(3, 35, true);
    const resolved = dropNodeAlerts('sensor-01', 't9');
    expect(resolved.map((a) => a.status)).toEqual(['resolved']);
    expect(resolved[0]?.resolvedAt).toBe('t9');
    expect(getActiveAlerts()).toEqual([]);
  });
});