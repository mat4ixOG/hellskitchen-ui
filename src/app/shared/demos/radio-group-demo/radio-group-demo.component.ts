import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { HkRadioGroupComponent, HkRadioOption } from 'hellskitchen-ui';

/** Roving tabindex: one tab stop, arrows move and select. */
@Component({
  selector: 'app-radio-group-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HkRadioGroupComponent],
  template: `
    <hk-radio-group class="w-full max-w-sm" [(value)]="value" [options]="options" label="Deploy strategy" />
  `
})
export class RadioGroupDemoComponent {
  readonly options: HkRadioOption[] = [
    { value: 'rolling', label: 'Rolling', hint: 'Replace instances in batches of 25%.' },
    { value: 'canary', label: 'Canary', hint: 'Send 5% of traffic for an hour first.' },
    { value: 'blue-green', label: 'Blue / green', hint: 'Stand up a full second fleet, then flip.' }
  ];

  readonly value = signal<unknown>('canary');
}
