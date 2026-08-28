import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';

export type PinType = 'numeric' | 'alphanumeric';

/**
 * Six boxes that behave like one field — paste splits, backspace walks back.
 *
 * `type` decides what a box will hold at all. Filtering on the way *in* rather
 * than validating afterwards is what makes a numeric pin feel like a number
 * pad: a letter never appears and then vanishes, it simply never lands. The
 * same filter runs on paste, so a copied code is cleaned by the same rule.
 */
@Component({
  selector: 'app-pin-input-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="w-full max-w-sm text-center">
      <p class="mb-3 text-xs text-slate-600 dark:text-gray-400">
        Enter the code we sent to <b class="text-slate-900 dark:text-white">…&#64;example.com</b>
      </p>

      <!-- Mode -->
      <div class="mb-4 flex justify-center gap-1" role="group" aria-label="Allowed characters">
        @for (item of types; track item) {
          <button type="button" (click)="setType(item)" [attr.aria-pressed]="type() === item"
            [class]="chip(type() === item)">{{ item }}</button>
        }
        <button type="button" (click)="masked.set(!masked())" [attr.aria-pressed]="masked()"
          [class]="chip(masked())">masked</button>
      </div>

      <div class="flex justify-center gap-2" (paste)="onPaste($event)">
        @for (char of chars(); track $index; let i = $index) {
          <input [attr.inputmode]="type() === 'numeric' ? 'numeric' : 'text'"
            [type]="masked() ? 'password' : 'text'"
            [attr.autocomplete]="i === 0 ? 'one-time-code' : 'off'"
            maxlength="1" [id]="'pin-' + i"
            class="h-11 w-9 rounded-xl border bg-white text-center text-lg font-semibold uppercase text-slate-900 outline-none transition-colors dark:bg-neutral-950 dark:text-white"
            [class]="char
              ? 'border-red-300 dark:border-red-700/60'
              : 'border-slate-200 focus:border-red-500 dark:border-white/10 dark:focus:border-red-600/70'"
            [value]="char" (input)="onInput(i, $any($event.target))"
            (keydown)="onKey(i, $event)" [attr.aria-label]="'Character ' + (i + 1)" />
        }
      </div>

      <p class="mt-4 text-xs" [class]="complete() ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-600 dark:text-gray-400'">
        {{ complete() ? 'Verified · ' + chars().join('') : 'Waiting for ' + remaining() + ' more' }}
      </p>
      <p class="mt-1 text-[0.7rem] text-slate-500 dark:text-gray-500">
        {{ type() === 'numeric' ? 'Letters are rejected — digits only.' : 'Letters and digits both accepted.' }}
      </p>
    </div>
  `
})
export class PinInputDemoComponent {
  readonly length = 6;
  readonly types: PinType[] = ['numeric', 'alphanumeric'];

  readonly type = signal<PinType>('numeric');
  readonly masked = signal(false);
  readonly chars = signal(['4', '2', '', '', '', '']);

  readonly complete = computed(() => this.chars().every((char) => char !== ''));
  readonly remaining = computed(() => this.chars().filter((char) => char === '').length);

  chip(active: boolean): string {
    const base =
      'cursor-pointer rounded-md border px-2 py-0.5 text-[0.72rem] transition-colors';
    return active
      ? `${base} border-red-300 bg-red-50 text-red-700 dark:border-red-700/60 dark:bg-red-950/40 dark:text-red-300`
      : `${base} border-slate-200 text-slate-600 hover:text-slate-900 dark:border-white/10 dark:text-gray-400 dark:hover:text-gray-200`;
  }

  setType(type: PinType): void {
    this.type.set(type);
    // Anything the new rule would not have accepted has to go, or the field
    // shows a value it would now refuse.
    this.chars.update((list) => list.map((char) => this.clean(char)));
  }

  /**
   * Rejected input is pushed back onto the element itself. The DOM has already
   * shown the keystroke by the time this runs, so resetting `value` is what
   * makes the letter disappear rather than sit there looking accepted.
   */
  onInput(index: number, element: HTMLInputElement): void {
    const char = this.clean(element.value);
    element.value = char;
    this.chars.update((list) => list.map((item, i) => (i === index ? char : item)));
    if (char) this.focus(index + 1);
  }

  onKey(index: number, event: KeyboardEvent): void {
    if (event.key === 'Backspace') {
      if (this.chars()[index]) return;
      this.focus(index - 1);
      return;
    }
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      this.focus(index - 1);
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      this.focus(index + 1);
    }
  }

  /** A pasted code fills the whole row rather than one box. */
  onPaste(event: ClipboardEvent): void {
    const raw = event.clipboardData?.getData('text') ?? '';
    const text = [...raw].map((char) => this.clean(char)).join('');
    if (!text) return;
    event.preventDefault();
    this.chars.update((list) => list.map((item, i) => text[i] ?? item));
    this.focus(Math.min(text.length, this.length - 1));
  }

  /** The one rule the whole component filters through. */
  private clean(value: string): string {
    const pattern = this.type() === 'numeric' ? /[^0-9]/g : /[^a-zA-Z0-9]/g;
    return value.replace(pattern, '').slice(-1).toUpperCase();
  }

  private focus(index: number): void {
    if (index < 0 || index >= this.length) return;
    document.getElementById(`pin-${index}`)?.focus();
  }
}
