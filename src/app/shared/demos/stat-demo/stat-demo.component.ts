import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HkStatComponent } from 'hellskitchen-ui';

/** KPI tile: count-up value, delta tone and an inline sparkline. */
@Component({
  selector: 'app-stat-demo',
  imports: [HkStatComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="grid w-full max-w-md gap-3 sm:grid-cols-2">
      @for (stat of stats; track stat.label) {
        <hk-stat [label]="stat.label" [value]="stat.value" [prefix]="stat.prefix" [suffix]="stat.suffix"
          [decimals]="stat.decimals" [delta]="stat.delta">
          <svg hkStatSpark viewBox="0 0 60 18" class="h-4 w-16" aria-hidden="true">
            <polyline [attr.points]="stat.spark" fill="none" stroke="currentColor" stroke-width="1.5" />
          </svg>
        </hk-stat>
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
}
