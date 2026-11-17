import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  computed,
  inject,
  input
} from '@angular/core';

let nextFormFieldId = 0;

/**
 * Label, hint and error wiring for any control you project inside it.
 *
 * Mark the control with `hkControl`: it picks up the generated id, the
 * `aria-describedby` pointing at the hint or the error, `aria-invalid` and
 * `required` — so the label always points at the real control.
 */
@Component({
  selector: 'hk-form-field',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (label()) {
      <label class="hk-field-label" [class.hk-sr]="labelHidden()" [attr.for]="controlId">
        {{ label() }}
        @if (required()) { <span class="hk-field-required" aria-hidden="true">*</span> }
      </label>
    }
    <ng-content />
    @if (error()) {
      <p class="hk-field-error" [id]="errorId">
        <span aria-hidden="true">⚠</span> {{ error() }}
      </p>
    } @else if (hint()) {
      <p class="hk-field-hint" [id]="hintId">{{ hint() }}</p>
    }
  `,
  styleUrl: './hk-form-field.component.css'
})
export class HkFormFieldComponent {
  readonly label = input('');
  readonly hint = input('');
  /** Error message. Non-empty sets aria-invalid on the control. */
  readonly error = input('');
  readonly required = input(false);
  /** Keeps the label for assistive tech but hides it visually. */
  readonly labelHidden = input(false);

  private readonly uid = `hk-field-${nextFormFieldId++}`;
  readonly controlId = `${this.uid}-control`;
  readonly hintId = `${this.uid}-hint`;
  readonly errorId = `${this.uid}-error`;

  readonly describedBy = computed(() =>
    this.error() ? this.errorId : this.hint() ? this.hintId : null
  );
}

/** Marks the control inside an `hk-form-field` so it can be wired up. */
@Directive({
  selector: '[hkControl]',
  standalone: true,
  host: {
    class: 'hk-control',
    '[id]': 'field?.controlId ?? null',
    '[attr.aria-describedby]': 'field?.describedBy() ?? null',
    '[attr.aria-invalid]': 'field?.error() ? "true" : null',
    '[attr.required]': 'field?.required() ? "" : null'
  }
})
export class HkControlDirective {
  readonly field = inject(HkFormFieldComponent, { optional: true });
}
