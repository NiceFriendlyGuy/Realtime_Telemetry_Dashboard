import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';
import type { ChartConfiguration } from 'chart.js';
import { TelemetrySocket } from '../../services/telemetry-socket';
import { HistoryPoint } from '../../models/telemetry';

//const API_URL = 'http://localhost:3000';
const HISTORY_MINUTES = 15;
const MAX_POINTS = 600;

@Component({
  selector: 'app-history-chart',
  imports: [BaseChartDirective],
  templateUrl: './history-chart.html',
  styleUrl: './history-chart.scss',
})
export class HistoryChart {
  readonly nodeId = input.required<string>();
  readonly metric = input.required<string>();

  private readonly telemetrySocket = inject(TelemetrySocket);
  private readonly points = signal<HistoryPoint[]>([]);
  protected readonly loadError = signal(false);

  constructor() {
    // Load history whenever the node or metric changes.
    effect((onCleanup) => {
      const nodeId = this.nodeId();
      const metric = this.metric();
      const controller = new AbortController();
      onCleanup(() => controller.abort());

      this.points.set([]);
      this.loadError.set(false);

      //const url = `${API_URL}/api/readings/${encodeURIComponent(nodeId)}/${encodeURIComponent(metric)}?minutes=${HISTORY_MINUTES}`;
      const url = `/api/readings/${encodeURIComponent(nodeId)}/${encodeURIComponent(metric)}?minutes=${HISTORY_MINUTES}`;

      fetch(url, { signal: controller.signal })
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json() as Promise<HistoryPoint[]>;
        })
        .then((rows) => this.points.set(rows))
        .catch((err: Error) => {
          if (err.name === 'AbortError') return;
          console.error('Failed to load history:', err.message);
          this.loadError.set(true);
        });
    });

    // Append each new live reading for this node and metric.
    effect(() => {
      const latest = this.telemetrySocket.readingsByNode()[this.nodeId()]?.[this.metric()];
      if (!latest) return;

      this.points.update((current) => {
        const last = current[current.length - 1];
        if (last && Date.parse(last.time) >= Date.parse(latest.timestamp)) return current;

        const point: HistoryPoint = {
          time: latest.timestamp,
          value: latest.value,
          anomaly: latest.anomaly,
          detectedAnomaly: latest.detectedAnomaly,
        };
        return [...current, point].slice(-MAX_POINTS);
      });
    });
  }

  protected readonly chartData = computed<ChartConfiguration<'line'>['data']>(() => {
    const pts = this.points();
    return {
      labels: pts.map((p) => new Date(p.time).toLocaleTimeString()),
      datasets: [
        {
          data: pts.map((p) => p.value),
          borderColor: '#3FA968',
          borderWidth: 1.5,
          tension: 0,
          pointRadius: pts.map((p) => (p.detectedAnomaly ? 3.5 : 0)),
          pointBackgroundColor: '#D9A441',
          pointBorderWidth: 0,
        },
      ],
    };
  });

  protected readonly options: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { ticks: { color: '#6B7684', maxTicksLimit: 6, maxRotation: 0 }, grid: { display: false } },
      y: { ticks: { color: '#6B7684' }, grid: { color: 'rgba(255, 255, 255, 0.06)' } },
    },
  };
}