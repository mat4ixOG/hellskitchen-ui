import { ChangeDetectionStrategy, Component, OnDestroy, computed, signal } from '@angular/core';

/** Linear, circular and indeterminate, all off one value. */
@Component({
  selector: 'app-progress-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="w-full max-w-sm space-y-6">
      <div>
        <div class="mb-2 flex justify-between text-xs">
          <span class="text-slate-600 dark:text-gray-400">Reindexing search</span>
          <span class="font-mono text-slate-900 dark:text-white">{{ value() }}%</span>
        </div>
        <div class="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10" role="progressbar"
          [attr.aria-valuenow]="value()" aria-valuemin="0" aria-valuemax="100">
          <span class="block h-full rounded-full bg-gradient-to-r from-red-600 to-red-800 transition-[width] duration-300"
            [style.width.%]="value()"></span>
        </div>
      </div>

      <div class="flex items-center gap-5">
        <svg viewBox="0 0 44 44" class="h-16 w-16 -rotate-90" aria-hidden="true">
          <circle cx="22" cy="22" r="19" fill="none" stroke="rgb(255 255 255 / 0.1)" stroke-width="4" />
          <circle cx="22" cy="22" r="19" fill="none" stroke="#dc2626" stroke-width="4" stroke-linecap="round"
            [attr.stroke-dasharray]="circumference"
            [attr.stroke-dashoffset]="offset()"
            class="transition-[stroke-dashoffset] duration-300" />
        </svg>
        <div>
          <p class="text-sm font-semibold text-slate-900 dark:text-white">{{ value() }}% complete</p>
          <p class="text-xs text-slate-600 dark:text-gray-400">{{ running() ? 'Running…' : 'Paused' }}</p>
          <button type="button" (click)="toggle()"
            class="mt-2 rounded-lg border border-slate-200 dark:border-white/10 px-2.5 py-1 text-xs text-slate-700 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white">
            {{ running() ? 'Pause' : 'Resume' }}
          </button>
        </div>
      </div>

      <div class="h-1 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
        <span class="block h-full w-1/3 rounded-full bg-red-600/80 animate-marquee"></span>
      </div>
    </div>
  `
})
export class ProgressDemoComponent implements OnDestroy {
  readonly circumference = 2 * Math.PI * 19;
  readonly value = signal(38);
  readonly running = signal(true);
  readonly offset = computed(() => this.circumference * (1 - this.value() / 100));

  private timer = setInterval(() => {
    if (!this.running()) return;
    this.value.update((value) => (value >= 100 ? 0 : value + 2));
  }, 240);

  toggle(): void {
    this.running.set(!this.running());
  }

  ngOnDestroy(): void {
    clearInterval(this.timer);
  }
}
