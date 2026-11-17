import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  input,
  model,
  output,
  signal
} from '@angular/core';

let nextId = 0;

/**
 * A tag input that accepts free text as well as a match — the "add what I
 * typed" case. Suggestions come from `options`; anything with no match is
 * committed as-is on Enter when `allowCustom` is on.
 */
@Component({
  selector: 'hk-combobox',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './hk-combobox.component.html',
  styleUrl: './hk-combobox.component.css'
})
export class HkComboboxComponent {
  /** Chosen values, custom entries included. Two-way bindable. */
  readonly value = model<string[]>([]);
  readonly options = input<readonly string[]>([]);
  readonly allowCustom = input(true);
  readonly maxItems = input<number | null>(null);
  readonly loading = input(false);
  readonly placeholder = input('Add a label…');

  /** Debounced query, for server-side suggestions. */
  readonly search = output<string>();

  readonly draft = signal('');
  readonly active = signal(-1);
  readonly dismissed = signal(false);

  readonly id = `hk-combobox-${nextId++}`;

  private searchTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      if (this.searchTimer) clearTimeout(this.searchTimer);
    });
  }

  readonly full = computed(() => {
    const max = this.maxItems();
    return max !== null && this.value().length >= max;
  });

  readonly suggestions = computed(() => {
    const draft = this.draft().trim().toLowerCase();
    if (!draft || this.dismissed() || this.full()) return [];
    return this.options().filter(
      (item) => item.toLowerCase().includes(draft) && !this.value().includes(item)
    );
  });

  readonly activeId = computed(() =>
    this.active() >= 0 && this.suggestions().length ? `${this.id}-opt-${this.active()}` : null
  );

  onInput(value: string): void {
    this.draft.set(value);
    this.dismissed.set(false);
    this.active.set(-1);
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => this.search.emit(value.trim()), 250);
  }

  add(tag: string): void {
    if (this.full()) return;
    if (!this.value().includes(tag)) this.value.set([...this.value(), tag]);
    this.draft.set('');
    this.active.set(-1);
  }

  /** Enter commits the highlighted suggestion, or the typed text. */
  commit(event: Event): void {
    event.preventDefault();
    const highlighted = this.suggestions()[this.active()];
    if (highlighted) return this.add(highlighted);
    const value = this.draft().trim();
    if (!value) return;
    const known = this.options().find((item) => item.toLowerCase() === value.toLowerCase());
    if (known) return this.add(known);
    if (this.allowCustom()) this.add(value);
  }

  remove(tag: string): void {
    this.value.set(this.value().filter((item) => item !== tag));
  }

  /** Backspace on an empty field peels the last tag, like every tag input should. */
  onBackspace(): void {
    if (this.draft()) return;
    this.value.set(this.value().slice(0, -1));
  }

  move(event: Event, step: number): void {
    const count = this.suggestions().length;
    if (!count) return;
    event.preventDefault();
    this.active.set((this.active() + step + count) % count);
  }

  dismiss(): void {
    this.dismissed.set(true);
    this.active.set(-1);
  }
}
