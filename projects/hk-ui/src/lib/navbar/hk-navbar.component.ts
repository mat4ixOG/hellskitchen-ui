import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  afterNextRender,
  computed,
  effect,
  inject,
  input,
  model,
  output,
  signal
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';

export type HkNavbarVariant = 'pill' | 'bar' | 'dock';
export type HkNavbarMotion = 'slide' | 'glow' | 'underline';

export interface HkNavbarItem {
  id: string;
  label: string;
  /** SVG path data for a 24×24 stroked icon. */
  icon?: string;
  /** Count shown beside the label. 0 or absent renders nothing. */
  badge?: number;
}

/**
 * Three navbars over one model. The active indicator is a single element that
 * travels between items; every item is the same width, so its offset is
 * `index / count` and nothing is measured.
 *
 * Projection slots: `[hkNavbarStart]` (brand) and `[hkNavbarEnd]` (actions)
 * for the pill and bar variants.
 */
@Component({
  selector: 'hk-navbar',
  standalone: true,
  imports: [NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './hk-navbar.component.html',
  styleUrl: './hk-navbar.component.css',
  host: {
    '[class.is-sticky]': 'sticky()',
    '[class.is-raised]': 'sticky() && raised()',
    '[class.is-narrow]': 'narrow()',
    '[style.--hk-nav-speed]': 'speed()'
  }
})
export class HkNavbarComponent {
  readonly items = input<HkNavbarItem[]>([]);
  readonly variant = input<HkNavbarVariant>('bar');
  /** What the travelling indicator animates. Ignored by dock. */
  readonly motion = input<HkNavbarMotion>('slide');
  /** Id of the current item. */
  readonly active = model('');
  /** Pins the bar to the top and raises it once the page scrolls. */
  readonly sticky = input(false);
  /** Width below which the bar's links collapse behind the burger. */
  readonly breakpoint = input('52rem');
  /** Indicator travel duration. */
  readonly speed = input('380ms');

  readonly selected = output<string>();
  readonly menuToggled = output<boolean>();

  readonly mobileOpen = signal(false);
  /** The dock's magnifier needs to know which icon the pointer is over. */
  readonly hovered = signal<string | null>(null);
  readonly narrow = signal(false);
  readonly raised = signal(false);

  readonly index = computed(() =>
    Math.max(0, this.items().findIndex((item) => item.id === this.active()))
  );
  readonly offset = computed(() => this.index() * 100);
  readonly width = computed(() => (this.items().length ? 100 / this.items().length : 0));

  private media: MediaQueryList | null = null;
  private readonly onMedia = (event: MediaQueryListEvent | MediaQueryList): void => {
    this.narrow.set(event.matches);
    if (!event.matches && this.mobileOpen()) this.setMobileOpen(false);
  };

  constructor() {
    const destroyRef = inject(DestroyRef);
    const rendered = signal(false);

    afterNextRender(() => {
      rendered.set(true);
      const onScroll = (): void => this.raised.set(window.scrollY > 0);
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
      destroyRef.onDestroy(() => window.removeEventListener('scroll', onScroll));
    });

    // Re-registers when the breakpoint changes; browser-only via `rendered`.
    effect(() => {
      const breakpoint = this.breakpoint();
      if (!rendered()) return;
      this.media?.removeEventListener('change', this.onMedia);
      this.media = window.matchMedia(`(max-width: ${breakpoint})`);
      this.media.addEventListener('change', this.onMedia);
      this.onMedia(this.media);
    });
    destroyRef.onDestroy(() => this.media?.removeEventListener('change', this.onMedia));
  }

  select(id: string): void {
    if (this.mobileOpen()) this.setMobileOpen(false);
    if (id === this.active()) return;
    this.active.set(id);
    this.selected.emit(id);
  }

  toggleMobile(): void {
    this.setMobileOpen(!this.mobileOpen());
  }

  /**
   * How far a dock icon lifts: full at the pointer, less either side,
   * nothing beyond — so the row bulges as one surface.
   */
  magnify(id: string): number {
    const hovered = this.hovered();
    if (!hovered) return 0;
    const items = this.items();
    const distance = Math.abs(
      items.findIndex((item) => item.id === id) - items.findIndex((item) => item.id === hovered)
    );
    if (distance === 0) return 1;
    if (distance === 1) return 0.45;
    if (distance === 2) return 0.15;
    return 0;
  }

  onKey(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.mobileOpen()) {
      this.setMobileOpen(false);
      return;
    }
    const target = event.target as HTMLElement;
    const group = target.closest('[data-hk-nav-group]');
    if (!group) return;
    const buttons = Array.from(group.querySelectorAll<HTMLElement>('[data-hk-nav-item]'));
    const current = buttons.indexOf(target);
    if (current === -1) return;
    const last = buttons.length - 1;
    let next: number | null = null;
    if (event.key === 'ArrowRight') next = current === last ? 0 : current + 1;
    if (event.key === 'ArrowLeft') next = current === 0 ? last : current - 1;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = last;
    if (next === null) return;
    event.preventDefault();
    buttons[next].focus();
  }

  private setMobileOpen(open: boolean): void {
    this.mobileOpen.set(open);
    this.menuToggled.emit(open);
  }
}
