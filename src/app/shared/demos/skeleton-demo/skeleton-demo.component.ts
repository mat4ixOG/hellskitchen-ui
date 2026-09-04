import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';

type Preset = 'profile' | 'article' | 'table' | 'media';
type Motion = 'shimmer' | 'pulse' | 'none';

/**
 * The point of a skeleton is that it occupies the same box the real content
 * will, so nothing shifts when the data lands. This demo makes that testable:
 * flip between loading and loaded and the layout must not move.
 */
@Component({
  selector: 'app-skeleton-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './skeleton-demo.component.html',
  styleUrl: './skeleton-demo.component.css'
})
export class SkeletonDemoComponent {
  readonly presets: { id: Preset; label: string }[] = [
    { id: 'profile', label: 'Profile' },
    { id: 'article', label: 'Article' },
    { id: 'table', label: 'Table' },
    { id: 'media', label: 'Media' }
  ];

  readonly motions: Motion[] = ['shimmer', 'pulse', 'none'];

  readonly preset = signal<Preset>('profile');
  readonly motion = signal<Motion>('shimmer');
  readonly loading = signal(true);

  /** Rows for the table preset — arbitrary, just needs a stable count. */
  readonly rows = [0, 1, 2, 3];

  readonly skinClass = computed(() => `sk sk-${this.motion()}`);

  /** Loading and loaded share one box, so the swap can't reflow the page. */
  toggle(): void {
    this.loading.set(!this.loading());
  }
}
