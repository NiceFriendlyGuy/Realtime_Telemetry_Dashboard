import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { vi } from 'vitest';
import { App } from './app';
import { TelemetrySocket } from './services/telemetry-socket';

describe('App', () => {
  it('opens the socket connection on startup', async () => {
    const connect = vi.fn();

    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        {
          provide: TelemetrySocket,
          useValue: { connect, nodeList: signal([]), readingsByNode: signal({}) },
        },
      ],
    }).compileComponents();

    TestBed.createComponent(App);
    expect(connect).toHaveBeenCalledOnce();
  });
});