import { describe, it, expect } from "vitest";
import { getNextReading } from "./simulator.js";

describe('getNextReading', () => {
    it('returns a number', () => {
        const result = getNextReading();
        expect(result.value).toEqual(expect.any(Number));
    });

    it('check if anomaly is a bool', () =>{
        const result = getNextReading();
        expect(result.anomaly).toEqual(expect.any(Boolean));
    });

    it('never produces NaN', () => {
        const result = getNextReading();
        expect(Number.isNaN(result.value)).toBe(false);
    });
})