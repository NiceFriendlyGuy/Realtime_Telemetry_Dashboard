import { describe, it, expect } from 'vitest';
import { isAnomaly, distanceOutsideRange } from './anomalyDetection.js';

const metricCases: [string, number, number][] = [
  ['Voltage', 12, 9.5],
  ['EventRate', 850, 1250],
  ['RadiationDose', 0.12, 0.72],
];

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

    it.each(metricCases)('%s: a normal value passes and a spike is flagged', (metric, normal, spike) => {
        expect(isAnomaly(metric, normal)).toBe(false);
        expect(isAnomaly(metric, spike)).toBe(true);
    });
    it('measures how far a value is outside its range', () => {
        expect(distanceOutsideRange('Temperature', 22)).toBe(0);
        expect(distanceOutsideRange('Temperature', 37)).toBe(7);
        expect(distanceOutsideRange('Temperature', 10)).toBe(5);
        expect(distanceOutsideRange('NotAMetric', 99)).toBe(0);
    });
});