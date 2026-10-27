import { Component, ElementRef, computed, inject, effect, signal, viewChild  } from '@angular/core';
import { TelemetrySocket } from '../../services/telemetry-socket';
import { Reading } from '../../models/telemetry';
import { HistoryChart } from '../history-chart/history-chart';
import { DashboardSelection } from '../../services/dashboard-selection';

@Component({
  selector: 'app-node-grid',
  imports: [HistoryChart],
  templateUrl: './node-grid.html',
  styleUrl: './node-grid.scss',
})
export class NodeGrid {

  protected telemetrySocket = inject(TelemetrySocket);
  protected readonly selection = inject(DashboardSelection);

  protected getReadingsForNode(nodeId: string): Reading[] {
    const nodeReadings = this.telemetrySocket.readingsByNode()[nodeId];
    return nodeReadings ? Object.values(nodeReadings) : [];
  }

  protected readonly selectedNodeId = signal<string | null>(null);

  protected readonly selectedNode = computed(
    () =>
      this.telemetrySocket.nodeList().find((n) => n.nodeId === this.selection.selectedNodeId()) ?? null,
  );

  protected select(nodeId: string): void {
    this.selectedNodeId.update((current) => (current === nodeId ? null : nodeId));
  }

  private readonly detail = viewChild<ElementRef<HTMLElement>>('detail');

  constructor() {
    // Bring the panel into view when a sensor is opened, e.g. from an alert far from the grid.
    effect(() => {
      this.selection.selectedNodeId();
      this.detail()?.nativeElement.scrollIntoView?.({ behavior: 'smooth', block: 'nearest' });
    });
  }

}
