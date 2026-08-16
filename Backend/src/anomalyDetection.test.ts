import { describe, it, expect } from 'vitest';
import { isAnomaly } from './anomalyDetection.js';

describe('isAnomaly', () => {
    it('no anomaly', () => {
        const result = isAnomaly('Temperature', 20);
        expect(result).toBe(false);
    })

    it('flags low anomaly', () => {
        const result = isAnomaly('Temperature', 10);
        expect(result).toBe(true);
    })

    it('flags high anomaly', () => {
        const result = isAnomaly('Temperature', 100);
        expect(result).toBe(true);
    })

    it('flags UNK', () => {
        const result = isAnomaly('NotAMetric', 100);
        expect(result).toBe(true);
    })
});