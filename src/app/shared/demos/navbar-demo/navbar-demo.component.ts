import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';

export type NavVariant = 'pill' | 'bar' | 'dock';
export type NavMotion = 'slide' | 'glow' | 'underline';

export interface NavItem {
  id: string;
  label: string;
  icon: string;
  badge?: number;
}

/**
 * Three navbars over one model.
 *
 * The active indicator is the part worth being careful about. It is a single
 * absolutely-positioned element that *moves* between items rather than a border
 * that appears on whichever item is current — one element transitioning is what
 * makes the travel readable, and it means the motion style is a swap of which
 * properties animate rather than three separate implementations.
 *
 * The measurement is deliberately arithmetic, not DOM: every item in a strip is
 * the same width, so the indicator's offset is `index / count`. No
 * ResizeObserver, no layout read, and nothing to go stale on a re-render.
 */
@Component({
  selector: 'app-navbar-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './navbar-demo.component.html',
  styleUrl: './navbar-demo.component.css'
})
export class NavbarDemoComponent {
  readonly variants: { id: NavVariant; label: string }[] = [
    { id: 'pill', label: 'Floating pill' },
    { id: 'bar', label: 'App bar' },
    { id: 'dock', label: 'Dock' }
  ];

  readonly motions: { id: NavMotion; label: string }[] = [
    { id: 'slide', label: 'Slide' },
    { id: 'glow', label: 'Glow' },
    { id: 'underline', label: 'Underline' }
  ];

  readonly items: NavItem[] = [
    { id: 'home', label: 'Home', icon: 'pi-home' },
    { id: 'projects', label: 'Projects', icon: 'pi-folder' },
    { id: 'activity', label: 'Activity', icon: 'pi-chart-line', badge: 4 },
    { id: 'team', label: 'Team', icon: 'pi-users' },
    { id: 'settings', label: 'Settings', icon: 'pi-cog' }
  ];

  readonly variant = signal<NavVariant>('pill');
  readonly motion = signal<NavMotion>('slide');
  readonly active = signal('home');
  readonly mobileOpen = signal(false);
  /** The dock's magnifier needs to know which icon the pointer is over. */
  readonly hovered = signal<string | null>(null);

  readonly index = computed(() => {
    const found = this.items.findIndex((item) => item.id === this.active());
    return found === -1 ? 0 : found;
  });

  readonly current = computed(() => this.items[this.index()]);

  /** Percent offset of the indicator, one item wide. */
  readonly offset = computed(() => this.index() * 100);
  readonly width = computed(() => 100 / this.items.length);

  select(id: string): void {
    this.active.set(id);
    this.mobileOpen.set(false);
  }

  /**
   * How far a dock icon lifts: full at the pointer, half either side, nothing
   * beyond. Distance-based rather than hover-only, which is what makes the row
   * bulge as one surface instead of one icon popping out of a flat line.
   */
  magnify(id: string): number {
    const hovered = this.hovered();
    if (!hovered) return 0;
    const distance = Math.abs(
      this.items.findIndex((item) => item.id === id) -
        this.items.findIndex((item) => item.id === hovered)
    );
    if (distance === 0) return 1;
    if (distance === 1) return 0.45;
    if (distance === 2) return 0.15;
    return 0;
  }

  chip(active: boolean): string {
    const base = 'cursor-pointer rounded-md border px-2.5 py-1 text-xs transition-colors';
    return active
      ? `${base} border-red-300 bg-red-50 text-red-700 dark:border-red-700/60 dark:bg-red-950/40 dark:text-red-300`
      : `${base} border-slate-200 text-slate-600 hover:text-slate-900 dark:border-white/10 dark:text-gray-400 dark:hover:text-white`;
  }
}
