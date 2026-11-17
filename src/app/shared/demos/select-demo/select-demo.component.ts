import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { HkSelectComponent } from 'hellskitchen-ui';

/** Typeahead single/multi select with a roving highlight. */
@Component({
  selector: 'app-select-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HkSelectComponent],
  template: `
    <hk-select
      [(value)]="picked"
      [options]="options"
      [multiple]="true"
      [filterable]="true"
      placeholder="Choose regions" />
  `
})
export class SelectDemoComponent {
  readonly options = [
    'us-east-1', 'us-west-2', 'eu-west-1', 'eu-central-1',
    'ap-south-1', 'ap-southeast-2', 'sa-east-1'
  ];

  readonly picked = signal<unknown>(['eu-west-1']);
}
