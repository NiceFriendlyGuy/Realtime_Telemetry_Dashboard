import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NodeGrid } from './node-grid';

describe('NodeGrid', () => {
  let component: NodeGrid;
  let fixture: ComponentFixture<NodeGrid>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NodeGrid],
    }).compileComponents();

    fixture = TestBed.createComponent(NodeGrid);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
