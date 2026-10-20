export const NODE_ID: string = process.env.NODE_ID ?? `sensor-${Math.random().toString(36).slice(2, 7)}`;

export interface Reading {
  nodeId: string;
  metric: string;
  unit: string;
  value: number;
  timestamp: string;
  anomaly: boolean;
}

interface MetricConfig {
  metric: string;
  unit: string;
  baseline: number;
  driftStrength: number;
  pullback: number;
  spikeChance: number; // probability per tick, 0 to 1
  spikeSize: number;
}

export const METRICS: MetricConfig[] = [
  { metric: 'Temperature',   unit: 'C',     baseline: 22,   driftStrength: 0.5,  pullback: 0.1, spikeChance: 0.02,  spikeSize: 15 },
  { metric: 'Voltage',       unit: 'V',     baseline: 12,   driftStrength: 0.05, pullback: 0.1, spikeChance: 0.01,  spikeSize: -2.5 },
  { metric: 'EventRate',     unit: 'Hz',    baseline: 850,  driftStrength: 25,   pullback: 0.1, spikeChance: 0.015, spikeSize: 400 },
  { metric: 'RadiationDose', unit: 'µSv/h', baseline: 0.12, driftStrength: 0.01, pullback: 0.1, spikeChance: 0.01,  spikeSize: 0.6 },
];

class MetricSimulator {
  private current: number;
  private readonly config: MetricConfig;

  constructor(config: MetricConfig) {
    this.config = config;
    this.current = config.baseline;
  }

  next(): Reading {
    const { baseline, driftStrength, pullback, spikeChance, spikeSize } = this.config;

    const drift = (Math.random() * 2 - 1) * driftStrength;
    const pullToBaseline = (baseline - this.current) * pullback;
    this.current += drift + pullToBaseline;

    const anomaly = Math.random() < spikeChance;
    if (anomaly) {
      this.current += spikeSize;
    }

    return {
      nodeId: NODE_ID,
      metric: this.config.metric,
      unit: this.config.unit,
      value: this.current,
      timestamp: new Date().toISOString(),
      anomaly,
    };
  }
}

export function createSimulator(): () => Reading[] {
  const simulators = METRICS.map((config) => new MetricSimulator(config));
  return () => simulators.map((simulator) => simulator.next());
}