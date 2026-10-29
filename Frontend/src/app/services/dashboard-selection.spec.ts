import { TestBed } from '@angular/core/testing';
import { DashboardSelection } from './dashboard-selection';

describe('DashboardSelection', () => {
  let selection: DashboardSelection;

  beforeEach(() => {
    selection = TestBed.inject(DashboardSelection);
  });

  it('starts with nothing selected', () => {
    expect(selection.selectedNodeId()).toBeNull();
  });

  it('open selects a node and replaces the previous selection', () => {
    selection.open('sensor-a');
    selection.open('sensor-b');
    expect(selection.selectedNodeId()).toBe('sensor-b');
  });

  it('toggle closes the node when it is already selected', () => {
    selection.toggle('sensor-a');
    expect(selection.selectedNodeId()).toBe('sensor-a');
    selection.toggle('sensor-a');
    expect(selection.selectedNodeId()).toBeNull();
  });

  it('clear removes the selection', () => {
    selection.open('sensor-a');
    selection.clear();
    expect(selection.selectedNodeId()).toBeNull();
  });
});