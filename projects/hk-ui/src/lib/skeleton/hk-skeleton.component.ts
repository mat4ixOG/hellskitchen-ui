import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';

export type HkSkeletonMotion = 'shimmer' | 'pulse' | 'none';

/** One stylesheet paints every placeholder; the motions only change how it moves. */
const HK_SKELETON_STYLES = `
  @layer components {
    :host {
      --hk-skeleton-fill: var(--hk-skeleton-base, #e8ecf1);
      --hk-skeleton-glint: var(--hk-skeleton-sheen, #f6f8fa);
    }
    :host-context(.dark) {
      --hk-skeleton-fill: var(--hk-skeleton-base, rgb(255 255 255 / 0.07));
      --hk-skeleton-glint: var(--hk-skeleton-sheen, rgb(255 255 255 / 0.14));
    }

    .hk-sk {
      display: block;
      background-color: var(--hk-skeleton-fill);
    }

    /* A sheen travelling across a fixed-size gradient — cheaper than animating
       background-position on a huge image, and it never reflows. */
    .hk-sk-shimmer {
      background-image: linear-gradient(90deg, transparent, var(--hk-skeleton-glint), transparent);
      background-size: 200% 100%;
      background-repeat: no-repeat;
      animation: hk-sk-sweep var(--hk-skeleton-speed, 1.4s) ease-in-out infinite;
    }
    @keyframes hk-sk-sweep {
      from { background-position: -120% 0; }
      to   { background-position: 220% 0; }
    }

    .hk-sk-pulse { animation: hk-sk-fade 1.6s ease-in-out infinite; }
    @keyframes hk-sk-fade {
      0%, 100% { opacity: 1; }
      50%      { opacity: 0.45; }
    }

    /* Reduced motion lands on the static box, not a slowed-down animation. */
    @media (prefers-reduced-motion: reduce) {
      .hk-sk-shimmer, .hk-sk-pulse { animation: none; }
    }
  }
`;

/**
 * Container that shows its placeholder children (`hk-skeleton-line`,
 * `hk-skeleton-circle`) while loading and projects the real content when not.
 * The motion set here is inherited by every placeholder inside it.
 */
@Component({
  selector: 'hk-skeleton',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'hk-skeleton',
    '[attr.aria-busy]': 'loading()'
  },
  template: `
    @if (loading()) {
      <ng-content select="hk-skeleton-line, hk-skeleton-circle" />
    } @else {
      <ng-content />
    }
  `,
  styles: `:host { display: block; }`
})
export class HkSkeletonComponent {
  /** Shows placeholders; projects the real content when false. */
  readonly loading = input(true);
  /** How the placeholders animate. */
  readonly motion = input<HkSkeletonMotion>('shimmer');
}

/** Shared motion resolution: an explicit input wins, then the container, then shimmer. */
function hkSkeletonMotion(own: () => HkSkeletonMotion | null) {
  const parent = inject(HkSkeletonComponent, { optional: true });
  return computed(() => `hk-sk hk-sk-${own() ?? parent?.motion() ?? 'shimmer'}`);
}

/**
 * A bar placeholder. With `lines` above one it repeats, tapering the last
 * line so the block reads as a paragraph.
 */
@Component({
  selector: 'hk-skeleton-line',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'hk-skeleton-line',
    'aria-hidden': 'true'
  },
  template: `
    @for (line of rows(); track $index) {
      <span [class]="skin()"
        [style.width]="line.last && rows().length > 1 ? '60%' : width()"
        [style.height]="height()"
        [style.border-radius]="radius()"></span>
    }
  `,
  styles: [HK_SKELETON_STYLES, `:host { display: flex; flex-direction: column; gap: 0.5rem; }`]
})
export class HkSkeletonLineComponent {
  readonly width = input('100%');
  readonly height = input('1em');
  readonly radius = input('0.375rem');
  /** Repeats the line primitive, tapering the last one. */
  readonly lines = input(1);
  readonly motion = input<HkSkeletonMotion | null>(null);

  readonly skin = hkSkeletonMotion(this.motion);
  readonly rows = computed(() => {
    const count = Math.max(1, Math.floor(this.lines()));
    return Array.from({ length: count }, (_, index) => ({ last: index === count - 1 }));
  });
}

/** A round placeholder, for an avatar or an icon. */
@Component({
  selector: 'hk-skeleton-circle',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'hk-skeleton-circle',
    'aria-hidden': 'true'
  },
  template: `<span [class]="skin()" [style.width]="size()" [style.height]="size()"></span>`,
  styles: [HK_SKELETON_STYLES, `:host { display: block; flex-shrink: 0; } .hk-sk { border-radius: 50%; }`]
})
export class HkSkeletonCircleComponent {
  readonly size = input('2.5rem');
  readonly motion = input<HkSkeletonMotion | null>(null);

  readonly skin = hkSkeletonMotion(this.motion);
}
