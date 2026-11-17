import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { HkNavbarComponent, HkNavbarItem, HkNavbarMotion, HkNavbarVariant } from 'hellskitchen-ui';

export type NavVariant = HkNavbarVariant;
export type NavMotion = HkNavbarMotion;
export type NavItem = HkNavbarItem;

/**
 * Three navbars over one model.
 *
 * The active indicator is a single element that *moves* between items rather
 * than a border that appears on whichever item is current — one element
 * transitioning is what makes the travel readable, and it means the motion
 * style is a swap of which properties animate rather than three
 * implementations. The offset is arithmetic (`index / count`), not measured.
 */
@Component({
  selector: 'app-navbar-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HkNavbarComponent],
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

  /** Icons are SVG path data (24×24, stroked). */
  readonly items: NavItem[] = [
    { id: 'home', label: 'Home', icon: 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z' },
    { id: 'projects', label: 'Projects', icon: 'M3 6a2 2 0 0 1 2-2h4l2 3h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z' },
    { id: 'activity', label: 'Activity', icon: 'M3 3v18h18M7 14l4-4 3 3 5-6', badge: 4 },
    { id: 'team', label: 'Team', icon: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8' },
    { id: 'settings', label: 'Settings', icon: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM12 2v3M12 19v3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M2 12h3M19 12h3M4.9 19.1 7 17M17 7l2.1-2.1' }
  ];

  readonly variant = signal<NavVariant>('pill');
  readonly motion = signal<NavMotion>('slide');
  readonly active = signal('home');

  readonly current = computed(
    () => this.items.find((item) => item.id === this.active()) ?? this.items[0]
  );

  chip(active: boolean): string {
    const base = 'cursor-pointer rounded-md border px-2.5 py-1 text-xs transition-colors';
    return active
      ? `${base} border-red-300 bg-red-50 text-red-700 dark:border-red-700/60 dark:bg-red-950/40 dark:text-red-300`
      : `${base} border-slate-200 text-slate-600 hover:text-slate-900 dark:border-white/10 dark:text-gray-400 dark:hover:text-white`;
  }
}
