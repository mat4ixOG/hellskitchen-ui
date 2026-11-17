import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  input,
  model,
  viewChildren
} from '@angular/core';

export interface HkRadioOption {
  value: unknown;
  label: string;
  hint?: string;
}

export type HkRadioOrientation = 'vertical' | 'horizontal';

/** Roving tabindex: one tab stop for the group, arrows move and select. */
@Component({
  selector: 'hk-radio-group',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="hk-radio-group" role="radiogroup"
      [attr.aria-label]="label() || null"
      [attr.aria-orientation]="orientation()"
      (keydown)="onKey($event)">
      @for (option of options(); track $index) {
        <button #radio type="button" role="radio" class="hk-radio"
          [class.is-selected]="value() === option.value"
          [attr.aria-checked]="value() === option.value"
          [tabindex]="isTabStop(option.value, $index) ? 0 : -1"
          (click)="value.set(option.value)">
          <span class="hk-radio-ring" aria-hidden="true">
            @if (value() === option.value) { <span class="hk-radio-dot"></span> }
          </span>
          <span>
            <span class="hk-radio-label">{{ option.label }}</span>
            @if (option.hint) { <span class="hk-radio-hint">{{ option.hint }}</span> }
          </span>
        </button>
      }
    </div>
  `,
  styleUrl: './hk-radio-group.component.css',
  host: {
    '[attr.data-orientation]': 'orientation()'
  }
})
export class HkRadioGroupComponent {
  /** Selected value. Two-way bindable via `[(value)]`. */
  readonly value = model<unknown>(null);
  readonly options = input<HkRadioOption[]>([]);
  readonly orientation = input<HkRadioOrientation>('vertical');
  /** Group label, exposed on the radiogroup. */
  readonly label = input('');

  private readonly radios = viewChildren<ElementRef<HTMLButtonElement>>('radio');

  /** With nothing selected the first option is the one tab stop. */
  isTabStop(value: unknown, index: number): boolean {
    const selected = this.options().some((option) => option.value === this.value());
    return selected ? this.value() === value : index === 0;
  }

  onKey(event: KeyboardEvent): void {
    const options = this.options();
    if (!options.length) return;
    const index = options.findIndex((option) => option.value === this.value());
    const last = options.length - 1;
    let next: number | null = null;
    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') next = index === last ? 0 : index + 1;
    if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') next = index <= 0 ? last : index - 1;
    if (next === null) return;
    event.preventDefault();
    this.value.set(options[next].value);
    this.radios()[next]?.nativeElement.focus();
  }
}
