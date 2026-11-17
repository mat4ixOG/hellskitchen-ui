import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { HkComboboxComponent } from 'hellskitchen-ui';

/** Accepts free text as well as a match — the "add what I typed" case. */
@Component({
  selector: 'app-combobox-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HkComboboxComponent],
  template: `
    <hk-combobox
      [(value)]="tags"
      [options]="pool"
      [allowCustom]="true"
      placeholder="Add a label…" />
  `
})
export class ComboboxDemoComponent {
  readonly pool = ['bug', 'regression', 'perf', 'a11y', 'docs', 'infra', 'design'];

  readonly tags = signal<string[]>(['perf']);
}
