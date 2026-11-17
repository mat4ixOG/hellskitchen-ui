import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { HkCheckboxComponent } from 'hellskitchen-ui';

/** Parent checkbox goes indeterminate when the children disagree. */
@Component({
  selector: 'app-checkbox-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HkCheckboxComponent],
  template: `
    <div class="w-full max-w-xs space-y-3">
      <hk-checkbox
        [checked]="all()"
        [indeterminate]="some()"
        label="Notify me about"
        class="font-semibold text-slate-900 dark:text-white"
        (changed)="toggleAll()" />

      <ul class="space-y-2 pl-7">
        @for (item of items; track item.key) {
          <li>
            <hk-checkbox
              [checked]="picked().includes(item.key)"
              [label]="item.label"
              (changed)="toggle(item.key)" />
          </li>
        }
      </ul>
    </div>
  `
})
export class CheckboxDemoComponent {
  readonly items = [
    { key: 'deploy', label: 'Deploys' },
    { key: 'incident', label: 'Incidents' },
    { key: 'review', label: 'Review requests' },
    { key: 'digest', label: 'Weekly digest' }
  ];

  readonly picked = signal<string[]>(['deploy', 'incident']);
  readonly all = computed(() => this.picked().length === this.items.length);
  readonly some = computed(() => this.picked().length > 0 && !this.all());

  toggle(key: string): void {
    const current = this.picked();
    this.picked.set(current.includes(key) ? current.filter((item) => item !== key) : [...current, key]);
  }

  toggleAll(): void {
    this.picked.set(this.all() ? [] : this.items.map((item) => item.key));
  }
}
