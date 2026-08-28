import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  HkButtonBadgePosition,
  HkButtonComponent,
  HkButtonShape,
  HkButtonSize,
  HkButtonTone,
  HkButtonVariant
} from '@hellskitchen/ui';

/**
 * The full matrix, plus the two states that are easy to get wrong: a loading
 * button that must not change width, and a disabled anchor that must not
 * navigate.
 */
@Component({
  selector: 'app-button-demo',
  imports: [HkButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './button-demo.component.html',
  styleUrl: './button-demo.component.css'
})
export class ButtonDemoComponent {
  readonly variants: HkButtonVariant[] = ['solid', 'soft', 'outline', 'ghost', 'link', 'glass'];
  readonly tones: HkButtonTone[] = ['brand', 'neutral', 'success', 'warning', 'danger'];
  readonly sizes: HkButtonSize[] = ['xs', 'sm', 'md', 'lg'];
  readonly shapes: HkButtonShape[] = ['rounded', 'pill', 'square'];
  readonly badgeSpots: (HkButtonBadgePosition | 'off')[] = ['off', 'inline', 'corner'];

  readonly variant = signal<HkButtonVariant>('solid');
  readonly tone = signal<HkButtonTone>('brand');
  readonly size = signal<HkButtonSize>('md');
  readonly shape = signal<HkButtonShape>('rounded');
  readonly busy = signal(false);
  readonly clicks = signal(0);
  readonly badgeSpot = signal<HkButtonBadgePosition | 'off'>('inline');
  readonly unread = signal(12);

  /** `null` is what switches the badge off, so 'off' maps to it here. */
  badgeFor(count: number): number | null {
    return this.badgeSpot() === 'off' ? null : count;
  }

  /** Position only matters once there is a badge; 'off' can send anything. */
  get badgeAt(): HkButtonBadgePosition {
    const spot = this.badgeSpot();
    return spot === 'off' ? 'inline' : spot;
  }

  bump(): void {
    this.unread.update((count) => (count >= 120 ? 1 : count + 7));
  }

  /** One place for the control-chip skin, so four groups do not repeat it. */
  chip(active: boolean): string {
    const base =
      'cursor-pointer rounded-md border px-2 py-0.5 text-[0.72rem] capitalize transition-colors';
    return active
      ? `${base} border-red-300 dark:border-red-700/60 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300`
      : `${base} border-slate-200 dark:border-white/10 text-slate-600 dark:text-gray-400 ` +
        'hover:border-slate-300 dark:hover:border-white/20 hover:text-slate-900 dark:hover:text-gray-200';
  }

  /** Stands in for a request so the loading state is real, not staged. */
  submit(): void {
    if (this.busy()) return;
    this.busy.set(true);
    this.clicks.update((n) => n + 1);
    setTimeout(() => this.busy.set(false), 1600);
  }
}
