import { Component, inject } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { TelemetrySocket } from '../../services/telemetry-socket';

@Component({
  selector: 'app-alert-feed',
  imports: [DatePipe, DecimalPipe],
  templateUrl: './alert-feed.html',
  styleUrl: './alert-feed.scss',
})
export class AlertFeed {
  protected readonly telemetrySocket = inject(TelemetrySocket);
}