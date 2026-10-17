import { Component, computed, inject, signal } from '@angular/core';
import { TelemetrySocket } from '../../services/telemetry-socket';
import { Reading } from '../../models/telemetry';
import { HistoryChart } from '../history-chart/history-chart';

@Component({
  selector: 'app-node-grid',
  imports: [HistoryChart],
  templateUrl: './node-grid.html',
  styleUrl: './node-grid.scss',
})
export class NodeGrid {

  protected telemetrySocket = inject(TelemetrySocket);

  protected getReadingsForNode(nodeId: string): Reading[] {
    const nodeReadings = this.telemetrySocket.readingsByNode()[nodeId];
    return nodeReadings ? Object.values(nodeReadings) : [];
  }

  protected readonly selectedNodeId = signal<string | null>(null);

  protected readonly selectedNode = computed(
    () => this.telemetrySocket.nodeList().find((n) => n.nodeId === this.selectedNodeId()) ?? null,
  );

  protected select(nodeId: string): void {
    this.selectedNodeId.update((current) => (current === nodeId ? null : nodeId));
  }
}
