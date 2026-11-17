import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  afterNextRender,
  computed,
  effect,
  inject,
  input,
  linkedSignal,
  model,
  signal
} from '@angular/core';

export interface HkSidebarNavItem {
  id: string;
  label: string;
}

export interface HkSidebarNavSection extends HkSidebarNavItem {
  /** SVG path data for a 24×24 stroked icon. Kept when the rail collapses. */
  icon?: string;
  children?: HkSidebarNavItem[];
}

/** Named breakpoints for `overlayBelow`; anything else is used as a CSS length. */
const HK_SIDEBAR_NAV_BREAKPOINTS: Record<string, string> = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px'
};

/**
 * A navigation rail that collapses to icons without losing its landmarks.
 * No router dependency: bind `[(active)]` and navigate from `activeChange`.
 */
@Component({
  selector: 'hk-sidebar-nav',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './hk-sidebar-nav.component.html',
  styleUrl: './hk-sidebar-nav.component.css',
  host: {
    '[class.is-collapsed]': 'collapsed()',
    '[class.is-overlay]': 'overlay() && !collapsed()',
    '(keydown.escape)': 'onEscape()'
  }
})
export class HkSidebarNavComponent {
  readonly sections = input<HkSidebarNavSection[]>([]);
  /** Collapses to the icon rail. */
  readonly collapsed = model(false);
  /** Active section or child id. */
  readonly active = model('');
  /** Breakpoint under which the expanded rail overlays instead of pushing content. */
  readonly overlayBelow = input('lg');

  /** Which section's children are showing; follows the active branch. */
  readonly open = linkedSignal<string | null>(() => this.branchOf(this.active()));
  readonly overlay = signal(false);

  readonly activeBranch = computed(() => this.branchOf(this.active()));

  constructor() {
    const destroyRef = inject(DestroyRef);
    const rendered = signal(false);
    afterNextRender(() => rendered.set(true));

    let media: MediaQueryList | null = null;
    const onChange = (event: MediaQueryListEvent | MediaQueryList): void => this.overlay.set(event.matches);

    effect(() => {
      const value = this.overlayBelow();
      if (!rendered()) return;
      media?.removeEventListener('change', onChange);
      media = window.matchMedia(`(max-width: ${HK_SIDEBAR_NAV_BREAKPOINTS[value] ?? value})`);
      media.addEventListener('change', onChange);
      onChange(media);
    });
    destroyRef.onDestroy(() => media?.removeEventListener('change', onChange));
  }

  pick(section: HkSidebarNavSection): void {
    const wasOpen = this.open() === section.id;
    this.active.set(section.id);
    this.open.set(wasOpen ? null : section.id);
  }

  pickChild(child: HkSidebarNavItem): void {
    this.active.set(child.id);
  }

  onEscape(): void {
    if (this.overlay() && !this.collapsed()) this.collapsed.set(true);
  }

  private branchOf(id: string): string | null {
    const section = this.sections().find(
      (item) => item.id === id || item.children?.some((child) => child.id === id)
    );
    return section?.id ?? null;
  }
}
