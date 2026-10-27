import { Service, signal } from '@angular/core';

@Service()
export class DashboardSelection {
  private readonly selected = signal<string | null>(null);
  readonly selectedNodeId = this.selected.asReadonly();

  open(nodeId: string): void {
    this.selected.set(nodeId);
  }

  toggle(nodeId: string): void {
    this.selected.update((current) => (current === nodeId ? null : nodeId));
  }

  clear(): void {
    this.selected.set(null);
  }
}