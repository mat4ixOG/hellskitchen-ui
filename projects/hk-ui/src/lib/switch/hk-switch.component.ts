import { ChangeDetectionStrategy, Component, computed, input, model, output } from '@angular/core';

export type HkSwitchSize = 'sm' | 'md' | 'lg';

/**
 * An on/off toggle with a spring-eased thumb. Model-bound through a signal,
 * so `[(checked)]` is all the wiring it needs.
 */
@Component({
  selector: 'hk-switch',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      type="button"
      role="switch"
      class="hk-switch-track"
      [class.is-on]="checked()"
      [class.is-crimson]="isCrimson()"
      [attr.aria-checked]="checked()"
      [attr.aria-label]="label() || null"
      [disabled]="disabled()"
      [style.--hk-switch-on]="isCrimson() ? null : accent()"
      (click)="toggle()">
      <span class="hk-switch-thumb"></span>
    </button>
  `,
  styleUrl: './hk-switch.component.css',
  host: {
    '[attr.data-size]': 'size()'
  }
})
export class HkSwitchComponent {
  /** Model value. Two-way bindable via `[(checked)]`. */
  readonly checked = model(false);
  readonly size = input<HkSwitchSize>('md');
  /** `'crimson'` for the brand gradient, or any CSS colour. */
  readonly accent = input('crimson');
  /** Accessible name of the switch. */
  readonly label = input('');
  readonly disabled = input(false);

  /** Fires with the new value after a toggle. */
  readonly changed = output<boolean>();

  readonly isCrimson = computed(() => this.accent() === 'crimson');

  toggle(): void {
    if (this.disabled()) return;
    const next = !this.checked();
    this.checked.set(next);
    this.changed.emit(next);
  }
}
