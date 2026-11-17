import { ChangeDetectionStrategy, Component, OnDestroy, signal } from '@angular/core';
import { HkProgressComponent } from 'hellskitchen-ui';

/** Linear, circular and indeterminate, all off one value. */
@Component({
  selector: 'app-progress-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HkProgressComponent],
  template: `
    <div class="w-full max-w-sm space-y-6">
      <hk-progress [value]="value()" label="Reindexing search" [showValue]="true" />

      <div class="flex items-center gap-5">
        <hk-progress variant="circular" [value]="value()" label="Reindexing search" />
        <div>
          <p class="text-sm font-semibold text-slate-900 dark:text-white">{{ value() }}% complete</p>
          <p class="text-xs text-slate-600 dark:text-gray-400">{{ running() ? 'Running…' : 'Paused' }}</p>
          <button type="button" (click)="toggle()"
            class="mt-2 rounded-lg border border-slate-200 dark:border-white/10 px-2.5 py-1 text-xs text-slate-700 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white">
            {{ running() ? 'Pause' : 'Resume' }}
          </button>
        </div>
      </div>

      <hk-progress [indeterminate]="true" label="Syncing" style="--hk-progress-height: 0.25rem" />
    </div>
  `
})
export class ProgressDemoComponent implements OnDestroy {
  readonly value = signal(38);
  readonly running = signal(true);

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
