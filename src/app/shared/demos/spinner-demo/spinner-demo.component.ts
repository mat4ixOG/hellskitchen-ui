import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

type Variant = 'ring' | 'dots' | 'bars' | 'pulse' | 'orbit' | 'comet' | 'morph';

/**
 * Spinners are sized off the current font size rather than a prop, so one
 * component drops into a button, a card or a full-page overlay unchanged.
 */
@Component({
  selector: 'app-spinner-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './spinner-demo.component.html',
  styleUrl: './spinner-demo.component.css'
})
export class SpinnerDemoComponent {
  readonly variants: Variant[] = ['ring', 'dots', 'bars', 'pulse', 'orbit', 'comet', 'morph'];
  readonly bars = [0, 1, 2, 3];
  readonly dots = [0, 1, 2];

  readonly variant = signal<Variant>('ring');
  readonly scale = signal(1);
  readonly busy = signal(false);

  /** Stands in for a request so the in-button state is real, not staged. */
  run(): void {
    if (this.busy()) return;
    this.busy.set(true);
    setTimeout(() => this.busy.set(false), 1800);
  }
}
