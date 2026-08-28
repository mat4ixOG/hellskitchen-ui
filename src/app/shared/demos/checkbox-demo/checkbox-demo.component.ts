import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';

/** Parent checkbox goes indeterminate when the children disagree. */
@Component({
  selector: 'app-checkbox-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="w-full max-w-xs space-y-3">
      <button type="button" (click)="toggleAll()"
        class="flex w-full items-center gap-3 text-left">
        <span class="grid h-4 w-4 place-items-center rounded border transition-colors"
          [class]="all() || some() ? 'border-red-600 bg-red-600 text-white' : 'border-slate-300 dark:border-white/20'">
          @if (all()) { <span class="text-[0.72rem] leading-none">✓</span> }
          @else if (some()) { <span class="h-0.5 w-2 bg-white dark:bg-neutral-950"></span> }
        </span>
        <span class="text-sm font-semibold text-slate-900 dark:text-white">Notify me about</span>
      </button>

      <ul class="space-y-2 pl-7">
        @for (item of items; track item.key) {
          <li>
            <button type="button" (click)="toggle(item.key)" class="flex w-full items-center gap-3 text-left">
              <span class="grid h-4 w-4 place-items-center rounded border transition-colors"
                [class]="picked().includes(item.key) ? 'border-red-600 bg-red-600 text-white' : 'border-slate-300 dark:border-white/20'">
                @if (picked().includes(item.key)) { <span class="text-[0.72rem] leading-none">✓</span> }
              </span>
              <span class="text-sm text-slate-700 dark:text-gray-300">{{ item.label }}</span>
            </button>
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
