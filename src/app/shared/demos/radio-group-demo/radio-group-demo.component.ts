import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

/** Roving tabindex: one tab stop, arrows move and select. */
@Component({
  selector: 'app-radio-group-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="w-full max-w-sm" role="radiogroup" aria-label="Deploy strategy" (keydown)="onKey($event)">
      @for (option of options; track option.value; let i = $index) {
        <button type="button" role="radio"
          [attr.aria-checked]="value() === option.value"
          [tabindex]="value() === option.value ? 0 : -1"
          (click)="value.set(option.value)"
          class="mb-2 flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-colors"
          [class]="value() === option.value
            ? 'border-red-300 dark:border-red-700/60 bg-red-50 dark:bg-red-950/40'
            : 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] hover:border-slate-300 dark:hover:border-white/20'">
          <span class="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full border"
            [class]="value() === option.value ? 'border-red-500 dark:border-red-600/70' : 'border-slate-400 dark:border-white/25'">
            @if (value() === option.value) { <span class="h-2 w-2 rounded-full bg-red-500"></span> }
          </span>
          <span>
            <span class="block text-sm font-semibold text-slate-900 dark:text-white">{{ option.label }}</span>
            <span class="block text-xs text-slate-600 dark:text-gray-400">{{ option.hint }}</span>
          </span>
        </button>
      }
    </div>
  `
})
export class RadioGroupDemoComponent {
  readonly options = [
    { value: 'rolling', label: 'Rolling', hint: 'Replace instances in batches of 25%.' },
    { value: 'canary', label: 'Canary', hint: 'Send 5% of traffic for an hour first.' },
    { value: 'blue-green', label: 'Blue / green', hint: 'Stand up a full second fleet, then flip.' }
  ];

  readonly value = signal('canary');

  onKey(event: KeyboardEvent): void {
    const index = this.options.findIndex((option) => option.value === this.value());
    const last = this.options.length - 1;
    let next: number | null = null;
    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') next = index === last ? 0 : index + 1;
    if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') next = index === 0 ? last : index - 1;
    if (next === null) return;
    event.preventDefault();
    this.value.set(this.options[next].value);
  }
}
