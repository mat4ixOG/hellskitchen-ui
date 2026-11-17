import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { HkMultiSelectComponent } from 'hellskitchen-ui';

/**
 * Multi-select with chips, grouped options and a filter-aware select-all —
 * the library's `hk-multi-select`, bound to a value readout.
 */
@Component({
  selector: 'app-multi-select-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HkMultiSelectComponent],
  template: `
    <div class="w-full max-w-sm">
      <hk-multi-select
        [(value)]="picked"
        [options]="options"
        groupBy="group"
        [maxChips]="3"
        placeholder="Choose regions…" />

      <p class="mt-3 text-xs text-slate-600 dark:text-gray-400">
        Value —
        <code class="text-red-600 dark:text-red-400">{{ picked().length ? picked().join(', ') : '[]' }}</code>
      </p>
    </div>
  `
})
export class MultiSelectDemoComponent {
  readonly options = [
    { value: 'us-east-1', label: 'us-east-1', group: 'Americas' },
    { value: 'us-west-2', label: 'us-west-2', group: 'Americas' },
    { value: 'sa-east-1', label: 'sa-east-1', group: 'Americas' },
    { value: 'eu-west-1', label: 'eu-west-1', group: 'Europe' },
    { value: 'eu-central-1', label: 'eu-central-1', group: 'Europe' },
    { value: 'eu-north-1', label: 'eu-north-1', group: 'Europe' },
    { value: 'ap-south-1', label: 'ap-south-1', group: 'Asia Pacific' },
    { value: 'ap-southeast-2', label: 'ap-southeast-2', group: 'Asia Pacific' },
    { value: 'ap-northeast-1', label: 'ap-northeast-1', group: 'Asia Pacific' }
  ];

  readonly picked = signal<string[]>(['eu-west-1', 'ap-south-1']);
}
