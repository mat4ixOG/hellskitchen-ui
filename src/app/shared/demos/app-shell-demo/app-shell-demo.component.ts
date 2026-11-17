import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { HkAppShellComponent } from 'hellskitchen-ui';

/** Header, rail and content frame, with the responsive rule made visible. */
@Component({
  selector: 'app-app-shell-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HkAppShellComponent],
  template: `
    <div class="w-full max-w-md">
      <!-- "Narrow" is simulated by raising the overlay breakpoint past any real viewport. -->
      <hk-app-shell [(navOpen)]="rail" navWidth="7rem" [overlayBelow]="narrow() ? '100000px' : 'lg'"
        style="--hk-shell-header-h: auto"
        class="overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-neutral-950">
        <header hkShellHeader class="flex items-center gap-2 px-3 py-2">
          <button type="button" class="rounded-md px-1.5 text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white"
            (click)="rail.set(!rail())" aria-label="Toggle navigation">☰</button>
          <span class="text-xs font-bold text-slate-900 dark:text-white">Night Shift</span>
          <span class="ml-auto h-5 w-5 rounded-full bg-gradient-to-br from-red-600 to-red-900"></span>
        </header>

        <nav hkShellNav class="p-2" aria-label="Demo app">
          @for (item of ['Overview', 'Services', 'Deploys']; track item) {
            <span class="mb-1 block rounded-md px-2 py-1 text-xs text-slate-600 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-white/5">{{ item }}</span>
          }
        </nav>

        <main hkShellContent class="h-40 p-3">
          <p class="text-xs font-semibold text-slate-900 dark:text-white">Content</p>
          <p class="mt-1 text-xs leading-relaxed text-slate-600 dark:text-gray-400">
            Below {{ narrow() ? 'the breakpoint the rail overlays' : 'the breakpoint the rail would overlay' }}
            the content instead of squeezing it.
          </p>
        </main>
      </hk-app-shell>

      <button type="button" (click)="narrow.set(!narrow())"
        class="mt-3 rounded-lg border border-slate-200 dark:border-white/10 px-3 py-1.5 text-xs text-slate-700 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white">
        Simulate {{ narrow() ? 'wide' : 'narrow' }} viewport
      </button>
    </div>
  `
})
export class AppShellDemoComponent {
  readonly rail = signal(true);
  readonly narrow = signal(false);
}
