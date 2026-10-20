import { describe, it, expect, afterEach, vi } from 'vitest';
import { createSimulator, METRICS } from './simulator.js';

describe('createSimulator', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('emits one reading per configured metric', () => {
        const readings = createSimulator()();
        expect(readings.map((r) => r.metric)).toEqual(METRICS.map((m) => m.metric));
    });

    it('never produces NaN or Infinity', () => {
        const next = createSimulator();
        for (let i = 0; i < 500; i++) {
            for (const reading of next()) {
                expect(Number.isFinite(reading.value)).toBe(true);
            }
        }
    });

    it('stays at baseline when drift is zero and no spike fires', () => {
        vi.spyOn(Math, 'random').mockReturnValue(0.5);
        const readings = createSimulator()();

        readings.forEach((reading, i) => {
            const config = METRICS[i];
            if (!config) throw new Error(`No metric config at index ${i}`);

            expect(reading.anomaly).toBe(false);
            expect(reading.value).toBeCloseTo(config.baseline);
        });
    });

    it('flags a spike and applies its size', () => {
        vi.spyOn(Math, 'random').mockReturnValue(0);
        const readings = createSimulator()();

        readings.forEach((reading, i) => {
            const config = METRICS[i];
            if (!config) throw new Error(`No metric config at index ${i}`);

            const { baseline, driftStrength, spikeSize } = config;
            expect(reading.anomaly).toBe(true);
            expect(reading.value).toBeCloseTo(baseline - driftStrength + spikeSize);
        });
    });
});