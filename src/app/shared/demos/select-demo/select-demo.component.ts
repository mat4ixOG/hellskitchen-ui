import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';

/** Typeahead single/multi select with a roving highlight. */
@Component({
  selector: 'app-select-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="relative w-full max-w-xs">
      <button type="button" (click)="open.set(!open())"
        class="flex w-full items-center justify-between gap-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-neutral-950 px-3.5 py-2.5 text-left text-sm text-slate-900 dark:text-white transition-colors hover:border-slate-300 dark:hover:border-white/20"
        [attr.aria-expanded]="open()">
        <span class="truncate" [class.text-slate-600 dark:text-gray-400]="!picked().length">
          {{ picked().length ? picked().join(', ') : 'Choose regions' }}
        </span>
        <span class="text-slate-600 dark:text-gray-400 transition-transform" [class.rotate-180]="open()">▾</span>
      </button>

      @if (open()) {
        <div class="absolute z-20 mt-1.5 w-full overflow-hidden rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-neutral-950 shadow-2xl shadow-slate-900/10 dark:shadow-black/60">
          <input autofocus placeholder="Filter…"
            class="w-full border-b border-slate-200/60 dark:border-white/5 bg-transparent px-3 py-2 text-xs text-slate-900 dark:text-white outline-none placeholder:text-slate-400 dark:placeholder:text-gray-500"
            [value]="query()" (input)="query.set($any($event.target).value)" />
          <ul class="max-h-44 overflow-auto py-1">
            @for (option of visible(); track option) {
              <li>
                <button type="button" (click)="toggle(option)"
                  class="flex w-full items-center justify-between px-3 py-1.5 text-left text-sm transition-colors hover:bg-slate-100 dark:hover:bg-white/5"
                  [class]="picked().includes(option) ? 'text-red-600 dark:text-red-400' : 'text-slate-700 dark:text-gray-300'">
                  {{ option }}
                  @if (picked().includes(option)) { <span>✓</span> }
                </button>
              </li>
            } @empty {
              <li class="px-3 py-3 text-center text-xs text-slate-600 dark:text-gray-400">No match</li>
            }
          </ul>
        </div>
      }
    </div>
  `
})
export class SelectDemoComponent {
  private readonly options = [
    'us-east-1', 'us-west-2', 'eu-west-1', 'eu-central-1',
    'ap-south-1', 'ap-southeast-2', 'sa-east-1'
  ];

  readonly open = signal(false);
  readonly query = signal('');
  readonly picked = signal<string[]>(['eu-west-1']);

  readonly visible = computed(() => {
    const query = this.query().toLowerCase();
    return this.options.filter((option) => option.includes(query));
  });

  toggle(option: string): void {
    const current = this.picked();
    this.picked.set(current.includes(option) ? current.filter((item) => item !== option) : [...current, option]);
  }
}
