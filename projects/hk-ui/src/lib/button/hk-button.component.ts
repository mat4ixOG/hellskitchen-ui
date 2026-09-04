import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  NgZone,
  computed,
  effect,
  inject,
  input,
  output,
  signal
} from '@angular/core';

export type HkButtonVariant =
  | 'solid'
  | 'soft'
  | 'outline'
  | 'ghost'
  | 'link'
  | 'glass';

export type HkButtonTone = 'brand' | 'neutral' | 'success' | 'warning' | 'danger';
export type HkButtonSize = 'xs' | 'sm' | 'md' | 'lg';
export type HkButtonShape = 'rounded' | 'pill' | 'square';
export type HkButtonBadgePosition = 'inline' | 'corner';
export type HkButtonBadgeTone = 'auto' | 'contrast' | 'brand' | 'neutral' | 'success' | 'warning' | 'danger';

/**
 * The button.
 *
 * Six variants × five tones × four sizes, but the surface stays small because
 * every combination is one token lookup rather than a hand-written skin.
 *
 * Two details that buttons usually get wrong and this one does not:
 *
 *   • **Loading keeps its width.** Swapping the label for a spinner reflows the
 *     row and moves whatever is next to it, so the label stays in the DOM at
 *     `visibility: hidden` and the spinner sits on top.
 *   • **Loading is disabled *and* announced.** `aria-busy` alone still lets a
 *     double-click through; `disabled` alone tells a screen reader nothing
 *     about why.
 */
@Component({
  selector: 'hk-button, button[hkButton], a[hkButton]',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './hk-button.component.html',
  styleUrl: './hk-button.component.css',
  host: {
    '[class]': 'hostClasses()',
    '[attr.data-variant]': 'variant()',
    '[attr.data-tone]': 'tone()',
    '[attr.data-badge-tone]': 'hasBadge() ? resolvedBadgeTone() : null',
    '[attr.disabled]': 'isNativeButton && (disabled() || loading()) ? "" : null',
    '[attr.aria-disabled]': '!isNativeButton && (disabled() || loading()) ? "true" : null',
    '[attr.aria-busy]': 'loading() ? "true" : null',
    '[attr.type]': 'isNativeButton ? type() : null',
    '(click)': 'onClick($event)'
  }
})
export class HkButtonComponent {
  readonly variant = input<HkButtonVariant>('solid');
  readonly tone = input<HkButtonTone>('brand');
  readonly size = input<HkButtonSize>('md');
  readonly shape = input<HkButtonShape>('rounded');
  /** Native button type. Ignored on an anchor. */
  readonly type = input<'button' | 'submit' | 'reset'>('button');
  readonly disabled = input(false);
  readonly loading = input(false);
  /** Stretches to the container width. */
  readonly block = input(false);
  /** Equal padding for an icon-only button. Requires an aria-label. */
  readonly iconOnly = input(false);
  /**
   * A specular highlight that tracks the pointer. On by default for `glass`,
   * where it is the whole point, and off elsewhere.
   */
  readonly shine = input<boolean | null>(null);

  /**
   * Count or short label rendered on the button. `null` and `0` render nothing
   * — a badge reading "0" is worse than no badge, because it draws the eye to
   * say there is nothing to see.
   */
  readonly badge = input<string | number | null>(null);
  /** `inline` sits after the label; `corner` floats over the top-right. */
  readonly badgePosition = input<HkButtonBadgePosition>('inline');
  /**
   * `auto` reads the variant: filled buttons get a contrast chip so the badge
   * does not vanish into the fill, everything else gets the accent.
   */
  readonly badgeTone = input<HkButtonBadgeTone>('auto');
  /** Counts above this collapse, so the badge cannot widen the button. */
  readonly badgeMax = input(99);

  readonly pressed = output<MouseEvent>();

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly zone = inject(NgZone);
  private readonly destroyRef = inject(DestroyRef);
  /** An anchor cannot carry `disabled`, so the two need different treatment. */
  readonly isNativeButton = this.host.nativeElement.tagName === 'BUTTON';

  readonly hasShine = computed(() =>
    this.shine() === null ? this.variant() === 'glass' : !!this.shine()
  );

  readonly hasBadge = computed(() => {
    const badge = this.badge();
    if (badge === null || badge === '') return false;
    // A numeric zero is "nothing to report", not something to announce.
    return typeof badge === 'number' ? badge > 0 : true;
  });

  /** What is painted. A number past `badgeMax` collapses to "99+". */
  readonly badgeLabel = computed(() => {
    const badge = this.badge();
    if (typeof badge !== 'number') return String(badge ?? '');
    const max = this.badgeMax();
    return badge > max ? `${max}+` : String(badge);
  });

  /** What is announced — the real count, not the collapsed glyph. */
  readonly badgeAnnounced = computed(() => String(this.badge() ?? ''));

  readonly resolvedBadgeTone = computed(() => {
    if (this.badgeTone() !== 'auto') return this.badgeTone();
    // On a filled surface the accent chip would disappear into it.
    return this.variant() === 'solid' ? 'contrast' : 'brand';
  });

  readonly hostClasses = computed(() =>
    [
      'hk-btn',
      `hk-btn-${this.size()}`,
      `hk-shape-${this.shape()}`,
      this.block() ? 'is-block' : '',
      this.iconOnly() ? 'is-icon' : '',
      this.loading() ? 'is-loading' : '',
      this.disabled() ? 'is-disabled' : '',
      this.hasShine() ? 'has-shine' : '',
      this.hasBadge() && this.badgePosition() === 'corner' ? 'has-corner-badge' : ''
    ]
      .filter(Boolean)
      .join(' ')
  );

  private frame: number | null = null;
  private detachShine: (() => void) | null = null;

  constructor() {
    // The shine listeners are attached only while the shine is actually on, and
    // always outside the zone. A `(pointermove)` host binding would be far
    // simpler, but it runs change detection on every pointer event for every
    // button on the page — including buttons that have no shine to update.
    effect(() => (this.hasShine() ? this.attachShine() : this.releaseShine()));
    this.destroyRef.onDestroy(() => this.releaseShine());
  }

  private attachShine(): void {
    if (this.detachShine) return;
    const element = this.host.nativeElement;
    const move = (event: PointerEvent): void => {
      if (this.frame !== null) return;
      // Pointer events outrun frames; collapse them to one write per frame.
      this.frame = requestAnimationFrame(() => {
        this.frame = null;
        const rect = element.getBoundingClientRect();
        element.style.setProperty('--hk-btn-mx', `${event.clientX - rect.left}px`);
        element.style.setProperty('--hk-btn-my', `${event.clientY - rect.top}px`);
      });
    };
    const leave = (): void => {
      // Drop any queued write, or it lands after the reset and the highlight
      // sticks where the pointer left.
      if (this.frame !== null) cancelAnimationFrame(this.frame);
      this.frame = null;
      element.style.setProperty('--hk-btn-mx', '50%');
      element.style.setProperty('--hk-btn-my', '50%');
    };

    this.zone.runOutsideAngular(() => {
      element.addEventListener('pointermove', move, { passive: true });
      element.addEventListener('pointerleave', leave, { passive: true });
    });

    this.detachShine = () => {
      element.removeEventListener('pointermove', move);
      element.removeEventListener('pointerleave', leave);
    };
  }

  private releaseShine(): void {
    if (this.frame !== null) cancelAnimationFrame(this.frame);
    this.frame = null;
    this.detachShine?.();
    this.detachShine = null;
  }

  onClick(event: MouseEvent): void {
    if (this.disabled() || this.loading()) {
      // An anchor is not really disabled; stop it here or it still navigates.
      event.preventDefault();
      event.stopImmediatePropagation();
      return;
    }
    this.pressed.emit(event);
  }

}
