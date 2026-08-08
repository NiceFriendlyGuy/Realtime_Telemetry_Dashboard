import { TestBed } from '@angular/core/testing';

import { TelemetrySocket } from './telemetry-socket';

describe('TelemetrySocket', () => {
  let service: TelemetrySocket;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TelemetrySocket);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
