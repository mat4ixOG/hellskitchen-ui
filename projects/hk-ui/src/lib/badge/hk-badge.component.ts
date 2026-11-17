import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type HkBadgeVariant = 'count' | 'dot';
export type HkBadgeTone = 'danger' | 'neutral' | 'success';

/**
 * A count or a dot, anchored to whatever is projected into it. Counts past
 * `max` collapse to "99+" so the badge never widens the layout beneath it.
 */
@Component({
  selector: 'hk-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ng-content />
    @if (visible()) {
      @if (variant() === 'dot') {
        <span class="hk-badge-dot" aria-hidden="true"></span>
      } @else {
        <span class="hk-badge-count">{{ label() }}</span>
      }
    }
  `,
  styleUrl: './hk-badge.component.css',
  host: { '[attr.data-tone]': 'tone()' }
})
export class HkBadgeComponent {
  /** Number shown. Zero hides the badge unless `showZero`. */
  readonly count = input(0);
  readonly max = input(99);
  readonly variant = input<HkBadgeVariant>('count');
  readonly showZero = input(false);
  readonly tone = input<HkBadgeTone>('danger');

  readonly visible = computed(() => this.count() > 0 || this.showZero());
  /** Anything past the cap collapses, so the badge never widens the layout. */
  readonly label = computed(() => (this.count() > this.max() ? `${this.max()}+` : String(this.count())));
}
