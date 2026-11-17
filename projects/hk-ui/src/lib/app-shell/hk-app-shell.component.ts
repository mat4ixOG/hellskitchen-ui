import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  afterNextRender,
  effect,
  inject,
  input,
  model,
  signal
} from '@angular/core';

/** Named breakpoints for `overlayBelow`; anything else is used as a CSS length. */
const HK_APP_SHELL_BREAKPOINTS: Record<string, string> = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px'
};

const HK_APP_SHELL_FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Header, navigation rail and content frame. Below `overlayBelow` the rail
 * overlays the content instead of squeezing it. Project your own landmarks:
 * `[hkShellHeader]`, `[hkShellNav]` and `[hkShellContent]`.
 */
@Component({
  selector: 'hk-app-shell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="hk-shell-header"><ng-content select="[hkShellHeader]" /></div>
    <div class="hk-shell-body">
      <div class="hk-shell-nav" [hidden]="!navOpen()" (keydown)="onNavKey($event)">
        <ng-content select="[hkShellNav]" />
      </div>
      <div class="hk-shell-content"><ng-content select="[hkShellContent]" /></div>
    </div>
  `,
  styleUrl: './hk-app-shell.component.css',
  host: {
    '[class.is-overlay]': 'overlay()',
    '[style.--hk-shell-nav-w]': 'navWidth()'
  }
})
export class HkAppShellComponent {
  /** Rail visibility. */
  readonly navOpen = model(true);
  /** Breakpoint under which the rail overlays rather than pushes. */
  readonly overlayBelow = input('lg');
  /** Expanded rail width. */
  readonly navWidth = input('13rem');

  readonly overlay = signal(false);

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
      media = window.matchMedia(`(max-width: ${HK_APP_SHELL_BREAKPOINTS[value] ?? value})`);
      media.addEventListener('change', onChange);
      onChange(media);
    });
    destroyRef.onDestroy(() => media?.removeEventListener('change', onChange));
  }

  toggleNav(): void {
    this.navOpen.set(!this.navOpen());
  }

  /** While the rail overlays, Escape closes it and Tab stays inside it. */
  onNavKey(event: KeyboardEvent): void {
    if (!this.overlay()) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      this.navOpen.set(false);
      return;
    }
    if (event.key !== 'Tab') return;
    const container = event.currentTarget as HTMLElement;
    const focusable = Array.from(container.querySelectorAll<HTMLElement>(HK_APP_SHELL_FOCUSABLE));
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
}
