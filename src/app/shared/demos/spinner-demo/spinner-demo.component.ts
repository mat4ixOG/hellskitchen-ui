import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { HkSpinnerComponent, HkSpinnerVariant } from 'hellskitchen-ui';

/**
 * Spinners are sized off the current font size rather than a prop, so one
 * component drops into a button, a card or a full-page overlay unchanged.
 */
@Component({
  selector: 'app-spinner-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HkSpinnerComponent],
  templateUrl: './spinner-demo.component.html',
  styleUrl: './spinner-demo.component.css'
})
export class SpinnerDemoComponent {
  readonly variants: HkSpinnerVariant[] = ['ring', 'dots', 'bars', 'pulse', 'orbit', 'comet', 'morph'];

  readonly variant = signal<HkSpinnerVariant>('ring');
  readonly scale = signal(1);
  readonly busy = signal(false);

  /** Stands in for a request so the in-button state is real, not staged. */
  run(): void {
    if (this.busy()) return;
    this.busy.set(true);
    setTimeout(() => this.busy.set(false), 1800);
  }
}
