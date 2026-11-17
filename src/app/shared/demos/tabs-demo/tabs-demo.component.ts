import { Component, signal } from '@angular/core';
import { HkTabComponent, HkTabPanelComponent, HkTabsComponent } from 'hellskitchen-ui';

interface Tab {
  value: string;
  label: string;
  /** Unread count. Zero means no badge at all, not a badge reading "0". */
  badge: number;
}

@Component({
  selector: 'app-tabs-demo',
  imports: [HkTabsComponent, HkTabComponent, HkTabPanelComponent],
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

  /** The tab hides its own badge on open; zero the source too so the next push counts from 0. */
  clear(value: string): void {
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
}
