import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  effect,
  input,
  linkedSignal,
  model,
  output,
  untracked,
  viewChildren
} from '@angular/core';

export type HkPinInputType = 'numeric' | 'alphanumeric';

/**
 * Separate boxes that behave like one field — paste splits, backspace walks
 * back. `type` decides what a box will hold at all: the filter runs on the way
 * in, so a rejected character never appears and then vanishes, it simply never
 * lands. The same filter runs on paste.
 */
@Component({
  selector: 'hk-pin-input',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="hk-pin" (paste)="onPaste($event)">
      @for (char of chars(); track $index; let i = $index) {
        <input #box class="hk-pin-box"
          [class.is-filled]="!!char"
          [attr.inputmode]="type() === 'numeric' ? 'numeric' : 'text'"
          [type]="mask() ? 'password' : 'text'"
          [attr.autocomplete]="i === 0 ? 'one-time-code' : 'off'"
          maxlength="1"
          [value]="char"
          [attr.aria-label]="'Character ' + (i + 1)"
          (input)="onInput(i, $any($event.target))"
          (keydown)="onKey(i, $event)" />
      }
    </div>
  `,
  styleUrl: './hk-pin-input.component.css'
})
export class HkPinInputComponent {
  /** Current code. Two-way bindable via `[(value)]`. */
  readonly value = model('');
  readonly length = input(6);
  readonly type = input<HkPinInputType>('numeric');
  /** Renders each character as a dot. */
  readonly mask = input(false);

  /** Emits the code once every box is filled. */
  readonly completed = output<string>();

  private readonly boxes = viewChildren<ElementRef<HTMLInputElement>>('box');

  /**
   * One slot per box. Boxes may be empty in the middle, which a plain string
   * cannot express, so the slots are only rebuilt when the value changes from
   * outside (i.e. no longer matches what the slots already spell).
   */
  readonly chars = linkedSignal<{ value: string; length: number }, string[]>({
    source: () => ({ value: this.value(), length: this.length() }),
    computation: (source, previous) => {
      const prev = previous?.value;
      if (prev && prev.length === source.length && prev.join('') === source.value) return prev;
      return Array.from({ length: source.length }, (_, i) => source.value[i] ?? '');
    }
  });

  constructor() {
    // Anything the new rule would not have accepted has to go, or the field
    // shows a value it would now refuse.
    effect(() => {
      this.type();
      untracked(() => {
        const cleaned = this.chars().map((char) => this.clean(char));
        if (cleaned.join('') !== this.chars().join('')) this.commit(cleaned);
      });
    });
  }

  /**
   * Rejected input is pushed back onto the element itself. The DOM has already
   * shown the keystroke by the time this runs, so resetting `value` is what
   * makes the character disappear rather than sit there looking accepted.
   */
  onInput(index: number, element: HTMLInputElement): void {
    const char = this.clean(element.value);
    element.value = char;
    this.commit(this.chars().map((item, i) => (i === index ? char : item)));
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
    this.commit(this.chars().map((item, i) => text[i] ?? item));
    this.focus(Math.min(text.length, this.length() - 1));
  }

  private commit(chars: string[]): void {
    const wasComplete = this.chars().every((char) => char !== '');
    this.chars.set(chars);
    const code = chars.join('');
    this.value.set(code);
    if (!wasComplete && chars.every((char) => char !== '')) this.completed.emit(code);
  }

  /** The one rule the whole component filters through. */
  private clean(value: string): string {
    const pattern = this.type() === 'numeric' ? /[^0-9]/g : /[^a-zA-Z0-9]/g;
    return value.replace(pattern, '').slice(-1).toUpperCase();
  }

  private focus(index: number): void {
    if (index < 0 || index >= this.length()) return;
    this.boxes()[index]?.nativeElement.focus();
  }
}
