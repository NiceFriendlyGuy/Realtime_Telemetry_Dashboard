import { Component, inject } from '@angular/core';
import { TelemetrySocket } from '../../services/telemetry-socket';
import { Reading } from '../../models/telemetry';

@Component({
  selector: 'app-node-grid',
  imports: [],
  templateUrl: './node-grid.html',
  styleUrl: './node-grid.scss',
})
export class NodeGrid {

  protected telemetrySocket = inject(TelemetrySocket);
  constructor() {
    this.telemetrySocket.connect();
  }

  protected getReadingsForNode(nodeId: string): Reading[] {
    const nodeReadings = this.telemetrySocket.readingsByNode()[nodeId];
    return nodeReadings ? Object.values(nodeReadings) : [];
  }
}
