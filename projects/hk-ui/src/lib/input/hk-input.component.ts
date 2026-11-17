import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  computed,
  inject,
  input,
  model,
  output
} from '@angular/core';

export type HkInputType = 'text' | 'email' | 'password' | 'number' | 'search';

let nextInputId = 0;

/**
 * One control with one border. The group owns the border and the focus ring;
 * the `hk-input` inside it is stripped bare and `hkInputAddon` elements sit
 * flush against it, so focus lights the whole group rather than a box inside
 * a box.
 */
@Component({
  selector: 'hk-input-group',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-content />`,
  styleUrl: './hk-input-group.component.css'
})
export class HkInputGroupComponent {}

/** A button or panel attached to the edge of an `hk-input-group`. */
@Directive({
  selector: '[hkInputAddon]',
  standalone: true,
  host: { class: 'hk-input-group-addon' }
})
export class HkInputAddonDirective {}

/**
 * A text field that owns its own chrome: prefix and suffix, addon panels, a
 * hint line that becomes the error line, and a clear button that appears once
 * there is something to clear.
 */
@Component({
  selector: 'hk-input',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './hk-input.component.html',
  styleUrl: './hk-input.component.css',
  host: {
    '[class.is-grouped]': 'grouped'
  }
})
export class HkInputComponent {
  /** Model value. Two-way bindable via `[(value)]`. */
  readonly value = model('');
  /** Visible label. Inside a group it becomes the field's aria-label instead. */
  readonly label = input('');
  readonly type = input<HkInputType>('text');
  readonly placeholder = input('');
  readonly prefix = input('');
  readonly suffix = input('');
  readonly hint = input('');
  readonly error = input('');
  readonly addonBefore = input('');
  readonly addonAfter = input('');
  readonly clearable = input(false);
  readonly readonly = input(false);
  readonly disabled = input(false);

  /** Emits when the clear button (or Escape) empties the field. */
  readonly cleared = output<void>();

  readonly grouped = inject(HkInputGroupComponent, { optional: true }) !== null;

  private readonly uid = `hk-input-${nextInputId++}`;
  readonly inputId = `${this.uid}-control`;
  readonly messageId = `${this.uid}-message`;

  readonly hasMessage = computed(() => !!this.error() || !!this.hint());
  readonly showClear = computed(
    () => this.clearable() && !!this.value() && !this.disabled() && !this.readonly()
  );

  onInput(value: string): void {
    this.value.set(value);
  }

  onEscape(): void {
    if (this.clearable() && this.value()) this.clear();
  }

  clear(): void {
    this.value.set('');
    this.cleared.emit();
  }
}
