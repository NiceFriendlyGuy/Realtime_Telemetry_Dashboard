interface ThresholdRange {
    min: number;
    max: number;
}

const METRIC_THRESHOLDS: Record<string, ThresholdRange> = {
  Temperature:   { min: 15,   max: 30 },
  Voltage:       { min: 11.5, max: 12.5 },
  EventRate:     { min: 700,  max: 1000 },
  RadiationDose: { min: 0.05, max: 0.3 },
};

export function distanceOutsideRange(metric: string, value: number): number {
  const range = METRIC_THRESHOLDS[metric];
  if (!range) return 0;
  if (value < range.min) return range.min - value;
  if (value > range.max) return value - range.max;
  return 0;
}

export function isAnomaly(metric:string, value:number): boolean{
    const range = METRIC_THRESHOLDS[metric];

    if(!range){
        return true;
    }

    return value < range.min || value > range.max;
};

