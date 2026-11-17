import { DestroyRef, Directive, inject, input, output, signal } from '@angular/core';

/**
 * Copies text on click, holds a confirmed state for a moment and then reverts
 * on its own — and reports failure, because the Clipboard API is refused often
 * enough that silence is a bug.
 *
 *   <button [hkCopy]="command" #copy="hkCopy">{{ copy.confirmed() ? 'Copied' : 'Copy' }}</button>
 *
 * While confirmed the host carries `.hk-copied` and `data-copied`.
 */
@Directive({
  selector: '[hkCopy]',
  standalone: true,
  exportAs: 'hkCopy',
  host: {
    '(click)': 'copy()',
    '[class.hk-copied]': 'confirmed()',
    '[attr.data-copied]': 'confirmed() ? "" : null'
  }
})
export class HkCopyDirective {
  /** Text to write to the clipboard. */
  readonly hkCopy = input('');
  /** How long the confirmed state lasts, in milliseconds. */
  readonly copyResetDelay = input(1600);

  readonly copied = output<string>();
  readonly copyFailed = output<Error>();

  /** True for `copyResetDelay` ms after a successful copy. */
  readonly confirmed = signal(false);

  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.clearTimer());
  }

  async copy(): Promise<void> {
    const text = this.hkCopy();
    try {
      if (typeof navigator === 'undefined' || !navigator.clipboard) {
        throw new Error('Clipboard API unavailable');
      }
      await navigator.clipboard.writeText(text);
    } catch (error) {
      this.clearTimer();
      this.confirmed.set(false);
      this.copyFailed.emit(error instanceof Error ? error : new Error(String(error)));
      return;
    }
    this.confirmed.set(true);
    this.copied.emit(text);
    this.clearTimer();
    this.timer = setTimeout(() => {
      this.timer = null;
      this.confirmed.set(false);
    }, this.copyResetDelay());
  }

  private clearTimer(): void {
    if (this.timer !== null) clearTimeout(this.timer);
    this.timer = null;
  }
}
