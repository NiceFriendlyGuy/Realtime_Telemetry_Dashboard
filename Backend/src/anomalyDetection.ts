interface ThresholdRange {
    min: number;
    max: number;
}

const METRIC_THRESHOLDS: Record<string, ThresholdRange> = {
    Temperature: {min:15, max: 30},
}

export function isAnomaly(metric:string, value:number): boolean{
    const range = METRIC_THRESHOLDS[metric];

    if(!range){
        return true;
    }

    return value < range.min || value > range.max;
};
