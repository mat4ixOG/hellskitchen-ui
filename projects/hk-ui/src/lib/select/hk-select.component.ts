import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  input,
  model,
  output,
  signal,
  viewChild
} from '@angular/core';

/** One choice. Plain strings are accepted as shorthand for `{ label, value }`. */
export interface HkSelectChoice {
  label: string;
  value: unknown;
}

let nextId = 0;

/**
 * Single or multi select with a typeahead filter.
 *
 * The trigger is a combobox and the panel a listbox; the active option is
 * tracked with aria-activedescendant, so DOM focus never leaves the trigger
 * (or the filter box, when there is one).
 */
@Component({
  selector: 'hk-select',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './hk-select.component.html',
  styleUrl: './hk-select.component.css'
})
export class HkSelectComponent {
  /** Selected value, or an array of values when `multiple`. Two-way bindable. */
  readonly value = model<unknown | unknown[]>(null);
  readonly options = input<readonly (HkSelectChoice | string)[]>([]);
  readonly multiple = input(false);
  readonly filterable = input(false);
  readonly placeholder = input('Select');
  readonly disabled = input(false);

  readonly opened = output<void>();
  readonly closed = output<void>();

  readonly open = signal(false);
  readonly query = signal('');
  readonly active = signal(-1);

  readonly id = `hk-select-${nextId++}`;

  private readonly trigger = viewChild<ElementRef<HTMLButtonElement>>('trigger');
  private readonly filterBox = viewChild<ElementRef<HTMLInputElement>>('filterBox');

  readonly normalized = computed<HkSelectChoice[]>(() =>
    this.options().map((option) =>
      typeof option === 'string' ? { label: option, value: option } : option
    )
  );

  readonly visible = computed(() => {
    const query = this.query().toLowerCase();
    return this.normalized().filter((option) => option.label.toLowerCase().includes(query));
  });

  readonly selected = computed<unknown[]>(() => {
    const value = this.value();
    if (Array.isArray(value)) return this.multiple() ? value : value.slice(0, 1);
    return value === null || value === undefined ? [] : [value];
  });

  readonly triggerLabel = computed(() =>
    this.selected()
      .map((value) => this.normalized().find((option) => option.value === value)?.label ?? String(value))
      .join(', ')
  );

  readonly activeId = computed(() =>
    this.open() && this.active() >= 0 ? `${this.id}-opt-${this.active()}` : null
  );

  isPicked(option: HkSelectChoice): boolean {
    return this.selected().includes(option.value);
  }

  toggleOpen(): void {
    if (this.open()) this.close();
    else this.openPanel();
  }

  openPanel(): void {
    if (this.disabled() || this.open()) return;
    this.open.set(true);
    this.active.set(Math.max(0, this.visible().findIndex((option) => this.isPicked(option))));
    this.opened.emit();
    if (this.filterable()) setTimeout(() => this.filterBox()?.nativeElement.focus());
  }

  close(refocus = false): void {
    if (!this.open()) return;
    this.open.set(false);
    this.query.set('');
    this.active.set(-1);
    this.closed.emit();
    if (refocus) this.trigger()?.nativeElement.focus();
  }

  onQuery(value: string): void {
    this.query.set(value);
    this.active.set(this.visible().length ? 0 : -1);
  }

  pick(option: HkSelectChoice): void {
    if (this.multiple()) {
      const current = this.selected();
      this.value.set(
        current.includes(option.value)
          ? current.filter((item) => item !== option.value)
          : [...current, option.value]
      );
      return;
    }
    this.value.set(option.value);
    this.close(true);
  }

  onKeydown(event: KeyboardEvent): void {
    const inFilter = event.target instanceof HTMLInputElement;
    const count = this.visible().length;

    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowUp': {
        event.preventDefault();
        if (!this.open()) return this.openPanel();
        const step = event.key === 'ArrowDown' ? 1 : -1;
        this.active.set(Math.min(count - 1, Math.max(0, this.active() + step)));
        return;
      }
      case 'Home':
      case 'End':
        if (!this.open() || inFilter) return;
        event.preventDefault();
        this.active.set(event.key === 'Home' ? 0 : count - 1);
        return;
      case 'Enter':
      case ' ': {
        if (event.key === ' ' && inFilter) return;
        event.preventDefault();
        if (!this.open()) return this.openPanel();
        const option = this.visible()[this.active()];
        if (option) this.pick(option);
        return;
      }
      case 'Escape':
        if (!this.open()) return;
        event.preventDefault();
        this.close(true);
        return;
      default:
        // Typeahead on the trigger: jump to the next option starting with the letter.
        if (inFilter || !this.open() || event.key.length !== 1) return;
        this.jumpTo(event.key.toLowerCase());
    }
  }

  private jumpTo(letter: string): void {
    const options = this.visible();
    for (let offset = 1; offset <= options.length; offset++) {
      const index = (this.active() + offset) % options.length;
      if (options[index].label.toLowerCase().startsWith(letter)) {
        this.active.set(index);
        return;
      }
    }
  }
}
