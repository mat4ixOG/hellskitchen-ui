import { Component, computed, signal } from '@angular/core';

interface Tab {
  value: string;
  label: string;
  /** Unread count. Zero means no badge at all, not a badge reading "0". */
  badge: number;
}

@Component({
  selector: 'app-tabs-demo',
  imports: [],
  templateUrl: './tabs-demo.component.html',
  styleUrl: './tabs-demo.component.css'
})
export class TabsDemoComponent {
  readonly tabs = signal<Tab[]>([
    { value: 'overview', label: 'Overview', badge: 0 },
    { value: 'api', label: 'API', badge: 0 },
    { value: 'theming', label: 'Theming', badge: 3 },
    { value: 'alerts', label: 'Alerts', badge: 12 }
  ]);

  readonly active = signal('overview');
  readonly badgeStyle = signal<'count' | 'dot'>('count');

  /** Drives the sliding indicator. */
  readonly index = computed(() => {
    const found = this.tabs().findIndex((tab) => tab.value === this.active());
    return found === -1 ? 0 : found;
  });

  /** Past 99 the badge collapses, so a busy tab never widens the strip. */
  label(count: number): string {
    return count > 99 ? '99+' : String(count);
  }

  /** Opening a tab is what "read" means, so the badge clears on select. */
  select(value: string): void {
    this.active.set(value);
    this.tabs.update((tabs) =>
      tabs.map((tab) => (tab.value === value ? { ...tab, badge: 0 } : tab))
    );
  }

  /** Stands in for a push, so the count is bound rather than hard-coded. */
  notify(): void {
    const candidates = this.tabs().filter((tab) => tab.value !== this.active());
    const target = candidates[Math.floor(Math.random() * candidates.length)];
    if (!target) return;
    this.tabs.update((tabs) =>
      tabs.map((tab) => (tab.value === target.value ? { ...tab, badge: tab.badge + 1 } : tab))
    );
  }

  /** Arrow-key navigation, the same map the real component ships. */
  onKey(event: KeyboardEvent): void {
    const tabs = this.tabs();
    const last = tabs.length - 1;
    const current = this.index();
    let next: number | null = null;

    if (event.key === 'ArrowRight') next = current === last ? 0 : current + 1;
    if (event.key === 'ArrowLeft') next = current === 0 ? last : current - 1;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = last;

    if (next === null) return;
    event.preventDefault();
    this.select(tabs[next].value);
  }
}
