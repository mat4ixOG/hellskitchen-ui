import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChildren,
  input,
  model,
  output
} from '@angular/core';

export type HkStepperVariant = 'rail' | 'panels' | 'progress';
export type HkStepperOrientation = 'horizontal' | 'vertical';

/** One step of an `hk-stepper`. Renders nothing itself; the stepper draws it. */
@Component({
  selector: 'hk-step',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '',
  host: { style: 'display: none' }
})
export class HkStepComponent {
  readonly label = input.required<string>();
  /** Copy shown under the open step in the panels and progress variants. */
  readonly detail = input('');
  /** In linear mode, later steps unlock only once this one is valid. */
  readonly valid = input(true);
}

/**
 * Three presentations of one wizard state. `variant` changes how the stepper
 * looks, never how it behaves or what it emits.
 */
@Component({
  selector: 'hk-stepper',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './hk-stepper.component.html',
  styleUrl: './hk-stepper.component.css',
  host: {
    '[class.is-vertical]': 'orientation() === "vertical"'
  }
})
export class HkStepperComponent {
  /** Zero-based active index. */
  readonly step = model(0);
  readonly variant = input<HkStepperVariant>('rail');
  readonly orientation = input<HkStepperOrientation>('horizontal');
  /** Requires each step to be valid before advancing. */
  readonly linear = input(false);

  /** Fires when the last step is confirmed with `next()`. */
  readonly completed = output<void>();

  readonly steps = contentChildren(HkStepComponent);

  readonly current = computed(() => this.steps()[this.step()] ?? null);

  /** The fill stops at the last marker rather than the container edge. */
  readonly railFill = computed(() => {
    const count = this.steps().length;
    return count > 1 ? (this.step() / (count - 1)) * 88 : 0;
  });

  /** Whether index can be reached from the current step. */
  canReach(index: number): boolean {
    if (!this.linear() || index <= this.step()) return true;
    return this.steps()
      .slice(0, index)
      .every((step) => step.valid());
  }

  go(index: number): void {
    const count = this.steps().length;
    if (index < 0 || index >= count || !this.canReach(index)) return;
    this.step.set(index);
  }

  next(): void {
    const last = this.steps().length - 1;
    if (this.step() >= last) {
      if (!this.linear() || this.steps()[last]?.valid()) this.completed.emit();
      return;
    }
    this.go(this.step() + 1);
  }

  prev(): void {
    this.go(Math.max(this.step() - 1, 0));
  }
}
