import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';

interface Option {
  value: string;
  label: string;
  group: string;
}

/**
 * Multi-select with chips.
 *
 * The two things that make a multi-select hard are both handled here rather
 * than left to the caller:
 *
 *   • **The trigger must not grow without bound.** Past `maxChips` the rest
 *     collapse into a "+n more" chip, so a picker with forty selections is the
 *     same height as one with two.
 *   • **Select-all has three states, not two.** With a filter active it acts on
 *     the *visible* rows only, which is what the checkbox has to report.
 */
@Component({
  selector: 'app-multi-select-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="relative w-full max-w-sm">
      <!-- Trigger -->
      <div
        class="flex min-h-11 w-full flex-wrap items-center gap-1.5 rounded-xl border bg-white px-2 py-1.5 text-left transition-colors dark:bg-neutral-950"
        [class]="open()
          ? 'border-red-500 dark:border-red-600/70'
          : 'border-slate-200 hover:border-slate-300 dark:border-white/10 dark:hover:border-white/20'">
        @if (!picked().length) {
          <button type="button" (click)="toggleOpen()"
            class="flex-1 px-1 py-1 text-left text-sm text-slate-400 dark:text-gray-500">
            Choose regions…
          </button>
        } @else {
          @for (chip of chips(); track chip) {
            <span
              class="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 py-0.5 pl-2 pr-1 text-xs font-medium text-red-700 dark:border-red-800/60 dark:bg-red-950/50 dark:text-red-300">
              {{ chip }}
              <button type="button" (click)="remove(chip)" [attr.aria-label]="'Remove ' + chip"
                class="rounded px-0.5 text-red-500 transition hover:text-red-800 dark:hover:text-red-200">×</button>
            </span>
          }
          @if (overflow() > 0) {
            <button type="button" (click)="toggleOpen()"
              class="rounded-lg border border-slate-200 px-2 py-0.5 text-xs font-medium text-slate-600 dark:border-white/10 dark:text-gray-400">
              +{{ overflow() }} more
            </button>
          }
          <button type="button" (click)="toggleOpen()" class="flex-1 py-1" aria-label="Open list"></button>
        }

        @if (picked().length) {
          <button type="button" (click)="clear()" aria-label="Clear all"
            class="px-1 text-slate-400 transition hover:text-slate-700 dark:text-gray-500 dark:hover:text-gray-200">×</button>
        }
        <button type="button" (click)="toggleOpen()" [attr.aria-expanded]="open()" aria-label="Toggle list"
          class="px-1 text-slate-500 transition-transform dark:text-gray-400" [class.rotate-180]="open()">▾</button>
      </div>

      <!-- Panel -->
      @if (open()) {
        <div
          class="absolute z-20 mt-1.5 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/10 dark:border-white/10 dark:bg-neutral-950 dark:shadow-black/60">
          <input autofocus placeholder="Filter regions…" [value]="query()"
            (input)="query.set($any($event.target).value)"
            class="w-full border-b border-slate-200/60 bg-transparent px-3 py-2 text-xs text-slate-900 outline-none placeholder:text-slate-400 dark:border-white/5 dark:text-white dark:placeholder:text-gray-500" />

          <!-- Select-all acts on what is visible, not on the whole list. -->
          <button type="button" (click)="toggleAll()"
            class="flex w-full items-center gap-2 border-b border-slate-200/60 px-3 py-2 text-left text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100 dark:border-white/5 dark:text-gray-300 dark:hover:bg-white/5">
            <span class="grid h-4 w-4 shrink-0 place-items-center rounded border text-[0.6rem] text-white transition-colors"
              [class]="allChecked() || someChecked()
                ? 'border-red-600 bg-red-600'
                : 'border-slate-300 dark:border-white/20'">
              <!-- Indeterminate is the same filled box as checked, distinguished
                   by a bar rather than a tick — the convention, and the only
                   version that stays legible at 16px. -->
              @if (allChecked()) { ✓ } @else if (someChecked()) {
                <span class="block h-0.5 w-2 rounded-full bg-white"></span>
              }
            </span>
            {{ allChecked() ? 'Deselect' : 'Select' }} all {{ query() ? 'matching' : '' }} ({{ visible().length }})
          </button>

          <ul class="max-h-52 overflow-auto py-1" role="listbox" aria-multiselectable="true">
            @for (group of grouped(); track group.name) {
              <li class="px-3 pb-1 pt-2 text-[0.65rem] font-bold uppercase tracking-wide text-slate-400 dark:text-gray-500">
                {{ group.name }}
              </li>
              @for (option of group.options; track option.value) {
                <li>
                  <button type="button" role="option" [attr.aria-selected]="isPicked(option.value)"
                    (click)="toggle(option.value)"
                    class="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm transition-colors hover:bg-slate-100 dark:hover:bg-white/5"
                    [class]="isPicked(option.value)
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-slate-700 dark:text-gray-300'">
                    <span class="grid h-4 w-4 shrink-0 place-items-center rounded border text-[0.6rem] text-white transition-colors"
                      [class]="isPicked(option.value)
                        ? 'border-red-600 bg-red-600'
                        : 'border-slate-300 dark:border-white/20'">
                      {{ isPicked(option.value) ? '✓' : '' }}
                    </span>
                    {{ option.label }}
                  </button>
                </li>
              }
            } @empty {
              <li class="px-3 py-4 text-center text-xs text-slate-500 dark:text-gray-400">No region matches “{{ query() }}”</li>
            }
          </ul>
        </div>
      }

      <p class="mt-3 text-xs text-slate-600 dark:text-gray-400">
        Value —
        <code class="text-red-600 dark:text-red-400">{{ picked().length ? picked().join(', ') : '[]' }}</code>
      </p>
    </div>
  `
})
export class MultiSelectDemoComponent {
  /** How many chips render before the rest collapse into "+n more". */
  readonly maxChips = 3;

  private readonly options: Option[] = [
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

  readonly open = signal(false);
  readonly query = signal('');
  readonly picked = signal<string[]>(['eu-west-1', 'ap-south-1']);

  readonly visible = computed(() => {
    const query = this.query().toLowerCase();
    return this.options.filter((option) => option.label.toLowerCase().includes(query));
  });

  readonly grouped = computed(() => {
    const buckets = new Map<string, Option[]>();
    for (const option of this.visible()) {
      const bucket = buckets.get(option.group);
      if (bucket) bucket.push(option);
      else buckets.set(option.group, [option]);
    }
    return [...buckets].map(([name, options]) => ({ name, options }));
  });

  readonly chips = computed(() => this.picked().slice(0, this.maxChips));
  readonly overflow = computed(() => Math.max(0, this.picked().length - this.maxChips));

  readonly allChecked = computed(() => {
    const visible = this.visible();
    return visible.length > 0 && visible.every((option) => this.isPicked(option.value));
  });

  readonly someChecked = computed(
    () => !this.allChecked() && this.visible().some((option) => this.isPicked(option.value))
  );

  isPicked(value: string): boolean {
    return this.picked().includes(value);
  }

  toggleOpen(): void {
    this.open.update((open) => !open);
  }

  toggle(value: string): void {
    this.picked.update((list) =>
      list.includes(value) ? list.filter((item) => item !== value) : [...list, value]
    );
  }

  remove(value: string): void {
    this.picked.update((list) => list.filter((item) => item !== value));
  }

  clear(): void {
    this.picked.set([]);
  }

  /** Adds or drops the visible rows only, leaving filtered-out picks alone. */
  toggleAll(): void {
    const visible = this.visible().map((option) => option.value);
    if (this.allChecked()) {
      this.picked.update((list) => list.filter((item) => !visible.includes(item)));
      return;
    }
    this.picked.update((list) => [...new Set([...list, ...visible])]);
  }
}
