import { Component, signal, inject } from '@angular/core';
import { TelemetrySocket } from './services/telemetry-socket';
import { NodeGrid } from './components/node-grid/node-grid';
import { AlertFeed } from './components/alert-feed/alert-feed';

@Component({
  selector: 'app-root',
  imports: [ NodeGrid, AlertFeed],
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
