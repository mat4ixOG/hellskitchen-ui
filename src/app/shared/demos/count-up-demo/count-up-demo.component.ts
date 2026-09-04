import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { CountUpDirective } from '../../directives/count-up.directive';

/** Animates a number into view; retriggers when the target changes. */
@Component({
  selector: 'app-count-up-demo',
  imports: [CountUpDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="w-full max-w-sm text-center">
      <div class="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-neutral-950 px-6 py-8">
        <p class="text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
          <span appCountUp [countTo]="target()" [countDuration]="1400" countPrefix="$" [countDecimals]="0">0</span>
        </p>
        <p class="mt-2 text-xs text-slate-600 dark:text-gray-400">Annual recurring revenue</p>
      </div>

      <div class="mt-3 flex justify-center gap-1.5">
        @for (option of [12500, 48000, 184000]; track option) {
          <button type="button" (click)="target.set(option)"
            class="rounded-lg border px-2.5 py-1 text-xs transition-colors"
            [class]="target() === option ? 'border-red-300 dark:border-red-700/60 bg-red-50 dark:bg-red-950/40 text-slate-900 dark:text-white' : 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-gray-400'">
            {{ option }}
          </button>
        }
      </div>
    </div>
  `
})
export class CountUpDemoComponent {
  readonly target = signal(48000);
}
