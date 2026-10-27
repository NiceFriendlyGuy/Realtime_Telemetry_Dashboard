import { Component, computed, inject } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { TelemetrySocket } from '../../services/telemetry-socket';
import { DashboardSelection } from '../../services/dashboard-selection';

@Component({
  selector: 'app-alert-feed',
  imports: [DatePipe, DecimalPipe],
  templateUrl: './alert-feed.html',
  styleUrl: './alert-feed.scss',
})
export class AlertFeed {
  protected readonly telemetrySocket = inject(TelemetrySocket);
  protected readonly selection = inject(DashboardSelection);

  protected readonly knownNodeIds = computed(
    () => new Set(this.telemetrySocket.nodeList().map((n) => n.nodeId)),
  );
}