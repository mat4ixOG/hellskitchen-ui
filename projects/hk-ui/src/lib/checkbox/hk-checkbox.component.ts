import { ChangeDetectionStrategy, Component, input, model, output } from '@angular/core';

/**
 * A checkbox with a real third state. `indeterminate` is independent of
 * `checked`, so a parent can report "some" while its children disagree.
 * The whole label is the hit target, not just the box.
 */
@Component({
  selector: 'hk-checkbox',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button type="button" role="checkbox" class="hk-checkbox"
      [attr.aria-checked]="indeterminate() ? 'mixed' : checked()"
      [disabled]="disabled()"
      (click)="toggle()">
      <span class="hk-checkbox-box" [class.is-on]="checked() || indeterminate()" aria-hidden="true">
        @if (indeterminate()) {
          <span class="hk-checkbox-dash"></span>
        } @else if (checked()) {
          <span class="hk-checkbox-tick">✓</span>
        }
      </span>
      @if (label()) {
        <span class="hk-checkbox-label">{{ label() }}</span>
      }
    </button>
  `,
  styleUrl: './hk-checkbox.component.css'
})
export class HkCheckboxComponent {
  /** Model value. Two-way bindable via `[(checked)]`. */
  readonly checked = model(false);
  /** Renders the mixed state. Independent of checked. */
  readonly indeterminate = input(false);
  readonly label = input('');
  readonly disabled = input(false);

  /** Emits the new value on toggle. */
  readonly changed = output<boolean>();

  toggle(): void {
    if (this.disabled()) return;
    const next = !this.checked();
    this.checked.set(next);
    this.changed.emit(next);
  }
}
