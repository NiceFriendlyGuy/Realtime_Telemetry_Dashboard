import { describe, it, expect } from 'vitest';
import { ReadingSchema } from './schema.js';

describe('ReadingSchema', () => {
  it('accepts a valid reading', () => {
    const valid = {
      nodeId: 'sensor-01',
      metric: 'Temperature',
      unit: 'C',
      value: 22.5,
      timestamp: new Date().toISOString(),
      anomaly: false,
    };

    const result = ReadingSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('rejects a reading missing a required field', () => {
    const invalid = {
      nodeId: 'sensor-01',
      metric: 'Temperature',
      // unit missing
      value: 22.5,
      timestamp: new Date().toISOString(),
      anomaly: false,
    };

    const result = ReadingSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('rejects a reading with the wrong type for value', () => {
    const invalid = {
        nodeId: 'sensor-01',
        metric: 'Temperature',
        unit: 'C',
        value: 'not-a-number', // wrong type
        timestamp: new Date().toISOString(),
        anomaly: false,
    };

    const result = ReadingSchema.safeParse(invalid);
    expect(result.success).toBe(false);
    });
});