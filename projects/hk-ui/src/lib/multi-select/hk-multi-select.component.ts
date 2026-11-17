import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  computed,
  inject,
  input,
  model,
  output,
  signal,
  viewChild
} from '@angular/core';

/** An option after `optionLabel` / `optionValue` / `groupBy` have been read. */
export interface HkMultiSelectOption {
  value: string;
  label: string;
  group: string | null;
}

let nextId = 0;

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
  selector: 'hk-multi-select',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './hk-multi-select.component.html',
  styleUrl: './hk-multi-select.component.css'
})
export class HkMultiSelectComponent {
  /** Selected values. Two-way bindable. */
  readonly value = model<string[]>([]);
  /** Source rows: objects or plain strings. */
  readonly options = input<readonly unknown[]>([]);
  readonly optionLabel = input('label');
  readonly optionValue = input('value');
  readonly groupBy = input<string | null>(null);
  /** How many chips render before the rest collapse into "+n more". */
  readonly maxChips = input(3);
  readonly selectAll = input(true);
  readonly filter = input(true);
  readonly maxSelected = input<number | null>(null);
  readonly placeholder = input('Select…');
  readonly disabled = input(false);

  /** Fires on every add, remove and clear. */
  readonly changed = output<string[]>();
  /** Filter text, debounced. */
  readonly filtered = output<string>();

  readonly open = signal(false);
  readonly query = signal('');
  readonly active = signal(-1);

  readonly id = `hk-ms-${nextId++}`;

  private readonly filterBox = viewChild<ElementRef<HTMLInputElement>>('filterBox');
  private filterTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      if (this.filterTimer) clearTimeout(this.filterTimer);
    });
  }

  readonly normalized = computed<HkMultiSelectOption[]>(() => {
    const labelKey = this.optionLabel();
    const valueKey = this.optionValue();
    const groupKey = this.groupBy();
    return this.options().map((option) => {
      if (typeof option !== 'object' || option === null) {
        return { value: String(option), label: String(option), group: null };
      }
      const row = option as Record<string, unknown>;
      return {
        value: String(row[valueKey]),
        label: String(row[labelKey] ?? row[valueKey]),
        group: groupKey ? String(row[groupKey] ?? '') : null
      };
    });
  });

  readonly visible = computed(() => {
    const query = this.query().toLowerCase();
    return this.normalized().filter((option) => option.label.toLowerCase().includes(query));
  });

  readonly grouped = computed(() => {
    const buckets = new Map<string, HkMultiSelectOption[]>();
    for (const option of this.visible()) {
      const name = option.group ?? '';
      const bucket = buckets.get(name);
      if (bucket) bucket.push(option);
      else buckets.set(name, [option]);
    }
    return [...buckets].map(([name, options]) => ({ name, options }));
  });

  readonly chips = computed(() => this.value().slice(0, this.maxChips()));
  readonly overflow = computed(() => Math.max(0, this.value().length - this.maxChips()));

  readonly full = computed(() => {
    const max = this.maxSelected();
    return max !== null && this.value().length >= max;
  });

  readonly allChecked = computed(() => {
    const visible = this.visible();
    return visible.length > 0 && visible.every((option) => this.isPicked(option.value));
  });

  readonly someChecked = computed(
    () => !this.allChecked() && this.visible().some((option) => this.isPicked(option.value))
  );

  readonly activeId = computed(() =>
    this.open() && this.active() >= 0 ? `${this.id}-opt-${this.active()}` : null
  );

  labelFor(value: string): string {
    return this.normalized().find((option) => option.value === value)?.label ?? value;
  }

  isPicked(value: string): boolean {
    return this.value().includes(value);
  }

  isBlocked(value: string): boolean {
    return this.full() && !this.isPicked(value);
  }

  indexOf(option: HkMultiSelectOption): number {
    return this.visible().indexOf(option);
  }

  toggleOpen(): void {
    if (this.disabled()) return;
    this.open.update((open) => !open);
    this.active.set(this.open() ? 0 : -1);
    if (this.open() && this.filter()) setTimeout(() => this.filterBox()?.nativeElement.focus());
  }

  onQuery(value: string): void {
    this.query.set(value);
    this.active.set(this.visible().length ? 0 : -1);
    if (this.filterTimer) clearTimeout(this.filterTimer);
    this.filterTimer = setTimeout(() => this.filtered.emit(value), 250);
  }

  toggle(value: string): void {
    if (this.disabled()) return;
    if (this.isPicked(value)) return this.commit(this.value().filter((item) => item !== value));
    if (this.full()) return;
    this.commit([...this.value(), value]);
  }

  remove(value: string): void {
    this.commit(this.value().filter((item) => item !== value));
  }

  /** Empties the selection without closing the panel. */
  clear(): void {
    this.commit([]);
  }

  /** Adds or drops the visible rows only, leaving filtered-out picks alone. */
  toggleAll(): void {
    if (this.disabled()) return;
    const visible = this.visible().map((option) => option.value);
    if (this.allChecked()) {
      this.commit(this.value().filter((item) => !visible.includes(item)));
      return;
    }
    const next = [...new Set([...this.value(), ...visible])];
    const max = this.maxSelected();
    this.commit(max === null ? next : next.slice(0, Math.max(max, this.value().length)));
  }

  onKeydown(event: KeyboardEvent): void {
    const inFilter = event.target instanceof HTMLInputElement;
    const count = this.visible().length;

    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowUp': {
        event.preventDefault();
        if (!this.open()) return this.toggleOpen();
        const step = event.key === 'ArrowDown' ? 1 : -1;
        this.active.set(Math.min(count - 1, Math.max(0, this.active() + step)));
        return;
      }
      case 'Enter':
      case ' ': {
        if (!this.open() || (event.key === ' ' && inFilter)) return;
        const option = this.visible()[this.active()];
        if (!option) return;
        event.preventDefault();
        this.toggle(option.value);
        return;
      }
      case 'Escape':
        if (!this.open()) return;
        event.preventDefault();
        this.open.set(false);
        this.active.set(-1);
        return;
      case 'Backspace':
        if (inFilter && !this.query() && this.value().length) {
          this.commit(this.value().slice(0, -1));
        }
        return;
      case 'a':
      case 'A':
        if (this.open() && (event.metaKey || event.ctrlKey)) {
          event.preventDefault();
          if (!this.allChecked()) this.toggleAll();
        }
        return;
    }
  }

  private commit(next: string[]): void {
    this.value.set(next);
    this.changed.emit(next);
  }
}
