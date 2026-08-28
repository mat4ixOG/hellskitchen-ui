import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { CountUpDirective } from '../../directives/count-up.directive';

/** KPI tile: count-up value, delta tone and an inline sparkline. */
@Component({
  selector: 'app-stat-demo',
  imports: [CountUpDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="grid w-full max-w-md gap-3 sm:grid-cols-2">
      @for (stat of stats; track stat.label) {
        <div class="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-neutral-950 p-4">
          <p class="text-[0.72rem] uppercase tracking-wider text-slate-600 dark:text-gray-400">{{ stat.label }}</p>
          <p class="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
            <span appCountUp [countTo]="stat.value" [countPrefix]="stat.prefix" [countSuffix]="stat.suffix"
              [countDecimals]="stat.decimals">0</span>
          </p>
          <div class="mt-2 flex items-center justify-between">
            <span class="text-xs font-semibold"
              [class]="stat.delta >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'">
              {{ stat.delta >= 0 ? '▲' : '▼' }} {{ abs(stat.delta) }}%
            </span>
            <svg viewBox="0 0 60 18" class="h-4 w-16" aria-hidden="true">
              <polyline [attr.points]="stat.spark" fill="none" stroke="currentColor" stroke-width="1.5"
                [class]="stat.delta >= 0 ? 'text-emerald-500/70' : 'text-red-500/70'" />
            </svg>
          </div>
        </div>
      }
    </div>
  `
})
export class StatDemoComponent {
  readonly stats = [
    { label: 'Deploys / week', value: 128, prefix: '', suffix: '', decimals: 0, delta: 12, spark: '0,14 12,11 24,12 36,6 48,7 60,2' },
    { label: 'p95 latency', value: 184, prefix: '', suffix: 'ms', decimals: 0, delta: -8, spark: '0,4 12,6 24,5 36,9 48,8 60,13' },
    { label: 'Error rate', value: 0.04, prefix: '', suffix: '%', decimals: 2, delta: -22, spark: '0,3 12,5 24,4 36,8 48,10 60,14' },
    { label: 'Monthly spend', value: 8420, prefix: '$', suffix: '', decimals: 0, delta: 3, spark: '0,12 12,10 24,11 36,8 48,9 60,6' }
  ];

  abs(value: number): number {
    return Math.abs(value);
  }
}
