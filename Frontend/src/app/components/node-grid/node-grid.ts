import { Component, inject } from '@angular/core';
import { TelemetrySocket } from '../../services/telemetry-socket';

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
}
