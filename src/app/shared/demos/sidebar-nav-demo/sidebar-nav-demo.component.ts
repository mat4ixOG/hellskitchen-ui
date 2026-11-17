import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { HkSidebarNavComponent, HkSidebarNavSection } from 'hellskitchen-ui';

/** Collapsible rail with expandable sections and an active marker. */
@Component({
  selector: 'app-sidebar-nav-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HkSidebarNavComponent],
  template: `
    <div class="flex w-full max-w-md gap-3">
      <hk-sidebar-nav [sections]="sections" [collapsed]="!wide()" (collapsedChange)="wide.set(!$event)" [(active)]="active" />

      <div class="flex-1 self-start rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] p-4">
        <p class="text-sm font-semibold text-slate-900 dark:text-white">{{ activeLabel() }}</p>
        <p class="mt-1 text-xs text-slate-600 dark:text-gray-400">The rail keeps its icons when collapsed, so muscle memory survives.</p>
        <button type="button" (click)="wide.set(!wide())"
          class="mt-3 rounded-lg border border-slate-200 dark:border-white/10 px-2.5 py-1.5 text-xs text-slate-700 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white">
          {{ wide() ? 'Collapse' : 'Expand' }}
        </button>
      </div>
    </div>
  `
})
export class SidebarNavDemoComponent {
  /** Icons are SVG path data (24×24, stroked). */
  readonly sections: HkSidebarNavSection[] = [
    { id: 'overview', label: 'Overview', icon: 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z' },
    {
      id: 'services',
      label: 'Services',
      icon: 'M4 3h16v7H4zM4 14h16v7H4zM8 6.5h.01M8 17.5h.01',
      children: [
        { id: 'billing-api', label: 'billing-api' },
        { id: 'auth-gateway', label: 'auth-gateway' },
        { id: 'edge-cache', label: 'edge-cache' }
      ]
    },
    {
      id: 'deploys',
      label: 'Deploys',
      icon: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12',
      children: [
        { id: 'history', label: 'History' },
        { id: 'schedules', label: 'Schedules' }
      ]
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM12 2v3M12 19v3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M2 12h3M19 12h3M4.9 19.1 7 17M17 7l2.1-2.1'
    }
  ];

  readonly wide = signal(true);
  readonly active = signal('services');

  readonly activeLabel = computed(() => {
    for (const section of this.sections) {
      if (section.id === this.active()) return section.label;
      const child = section.children?.find((item) => item.id === this.active());
      if (child) return child.label;
    }
    return '';
  });
}
