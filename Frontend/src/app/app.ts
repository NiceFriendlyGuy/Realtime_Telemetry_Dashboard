import { Component, signal, inject } from '@angular/core';
import { TelemetrySocket } from './services/telemetry-socket';

@Component({
  selector: 'app-root',
  imports: [],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly title = signal('frontend');
  private telemetrySocket = inject(TelemetrySocket);
  constructor() {
    this.telemetrySocket.connect();
  }
}
