import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

/** Collapsible rail with expandable sections and an active marker. */
@Component({
  selector: 'app-sidebar-nav-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex w-full max-w-md gap-3">
      <nav class="overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-neutral-950 p-2 transition-[width] duration-300"
        [style.width]="wide() ? '13rem' : '3.25rem'" aria-label="Demo sections">
        @for (section of sections; track section.label) {
          <div>
            <button type="button" (click)="pick(section.label)"
              class="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-sm transition-colors"
              [class]="active() === section.label ? 'bg-red-50 dark:bg-red-950/40 text-slate-900 dark:text-white' : 'text-slate-600 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-white/5'">
              <i [class]="section.icon + ' shrink-0 text-sm'"
                [class.text-red-600 dark:text-red-400]="active() === section.label"></i>
              @if (wide()) { <span class="flex-1 truncate">{{ section.label }}</span> }
              @if (wide() && section.children) {
                <span class="text-xs text-slate-600 dark:text-gray-400 transition-transform" [class.rotate-90]="open() === section.label">›</span>
              }
            </button>

            @if (wide() && section.children && open() === section.label) {
              <ul class="mb-1 ml-6 border-l border-slate-200 dark:border-white/10 pl-3">
                @for (child of section.children; track child) {
                  <li>
                    <button type="button" class="w-full py-1 text-left text-xs text-slate-600 dark:text-gray-400 hover:text-slate-800 dark:hover:text-gray-200">
                      {{ child }}
                    </button>
                  </li>
                }
              </ul>
            }
          </div>
        }
      </nav>

      <div class="flex-1 self-start rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] p-4">
        <p class="text-sm font-semibold text-slate-900 dark:text-white">{{ active() }}</p>
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
  readonly sections = [
    { label: 'Overview', icon: 'pi pi-home' },
    { label: 'Services', icon: 'pi pi-server', children: ['billing-api', 'auth-gateway', 'edge-cache'] },
    { label: 'Deploys', icon: 'pi pi-upload', children: ['History', 'Schedules'] },
    { label: 'Settings', icon: 'pi pi-cog' }
  ];

  readonly wide = signal(true);
  readonly active = signal('Services');
  readonly open = signal<string | null>('Services');

  pick(label: string): void {
    this.active.set(label);
    this.open.set(this.open() === label ? null : label);
  }
}
