import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AlertFeed } from './alert-feed';

describe('AlertFeed', () => {
  let component: AlertFeed;
  let fixture: ComponentFixture<AlertFeed>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AlertFeed],
    }).compileComponents();

    fixture = TestBed.createComponent(AlertFeed);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
