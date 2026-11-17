import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  PLATFORM_ID,
  computed,
  effect,
  inject,
  input,
  model,
  viewChild
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * A textarea that grows with its content up to a ceiling, then scrolls — so a
 * one-line note does not reserve six lines of empty space. Anything projected
 * inside renders on the left of the footer, opposite the counter.
 */
@Component({
  selector: 'hk-textarea',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="hk-textarea-box">
      <textarea #box class="hk-textarea-control"
        [rows]="rows()"
        [attr.maxlength]="maxlength()"
        [attr.aria-label]="label() || null"
        [placeholder]="placeholder()"
        [value]="value()"
        (input)="value.set($any($event.target).value)"></textarea>
      <div class="hk-textarea-footer">
        <span class="hk-textarea-note"><ng-content /></span>
        @if (showCounter()) {
          <span class="hk-textarea-counter" [class.is-low]="remaining() < 30"
            [attr.aria-live]="remaining() < 30 ? 'polite' : 'off'">{{ remaining() }}</span>
        }
      </div>
    </div>
  `,
  styleUrl: './hk-textarea.component.css'
})
export class HkTextareaComponent {
  /** Model value. Two-way bindable via `[(value)]`. */
  readonly value = model('');
  /** Accessible name of the field. */
  readonly label = input('');
  readonly placeholder = input('');
  readonly rows = input(2);
  /** Height ceiling in rows. Past it the field scrolls instead of growing. */
  readonly maxRows = input(10);
  readonly autoGrow = input(true);
  readonly maxlength = input<number | null>(null);
  /** Shows characters remaining. Needs maxlength. */
  readonly counter = input(false);

  readonly showCounter = computed(() => this.counter() && this.maxlength() !== null);
  readonly remaining = computed(() => (this.maxlength() ?? 0) - this.value().length);

  private readonly box = viewChild.required<ElementRef<HTMLTextAreaElement>>('box');
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  constructor() {
    // Resize after the value lands, so the first paint is already the right size.
    effect(() => {
      this.value();
      const maxRows = this.maxRows();
      if (!this.isBrowser || !this.autoGrow()) return;
      const element = this.box().nativeElement;
      const style = getComputedStyle(element);
      const line = parseFloat(style.lineHeight) || 20;
      const padding = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
      element.style.height = 'auto';
      element.style.height = `${Math.min(element.scrollHeight, maxRows * line + padding)}px`;
    });
  }
}
