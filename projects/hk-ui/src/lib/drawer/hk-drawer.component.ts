import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterRenderEffect,
  input,
  model,
  viewChild
} from '@angular/core';

export type HkDrawerSide = 'left' | 'right' | 'top' | 'bottom';

const HK_DRAWER_FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Edge sheet from any side. The panel slides, the scrim fades, and on touch it
 * can be swiped away. It covers its nearest positioned ancestor.
 */
@Component({
  selector: 'hk-drawer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './hk-drawer.component.html',
  styleUrl: './hk-drawer.component.css'
})
export class HkDrawerComponent {
  /** Visibility. Two-way bindable; `openChange` emits on open and close. */
  readonly open = model(false);
  readonly side = input<HkDrawerSide>('right');
  /** Width for side drawers, height for top and bottom. */
  readonly size = input('18rem');
  readonly swipeToClose = input(true);
  /** Accessible name of the panel. */
  readonly label = input('Drawer');

  private readonly panel = viewChild<ElementRef<HTMLElement>>('panel');
  private returnFocus: HTMLElement | null = null;
  private touchStart: { x: number; y: number } | null = null;

  constructor() {
    // Runs in the browser only: move focus in on open, give it back on close.
    afterRenderEffect(() => {
      const panel = this.panel()?.nativeElement;
      if (this.open() && panel) {
        if (!panel.contains(document.activeElement)) {
          this.returnFocus = document.activeElement as HTMLElement | null;
          panel.focus();
        }
      } else if (!this.open() && this.returnFocus) {
        this.returnFocus.focus?.();
        this.returnFocus = null;
      }
    });
  }

  close(): void {
    this.open.set(false);
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.stopPropagation();
      this.close();
      return;
    }
    if (event.key !== 'Tab') return;
    const panel = this.panel()?.nativeElement;
    if (!panel) return;
    const items = Array.from(panel.querySelectorAll<HTMLElement>(HK_DRAWER_FOCUSABLE));
    if (!items.length) {
      event.preventDefault();
      return;
    }
    const first = items[0];
    const last = items[items.length - 1];
    const active = document.activeElement;
    if (event.shiftKey && (active === first || active === panel)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }

  onTouchStart(event: TouchEvent): void {
    const touch = event.touches[0];
    this.touchStart = touch ? { x: touch.clientX, y: touch.clientY } : null;
  }

  onTouchEnd(event: TouchEvent): void {
    const start = this.touchStart;
    this.touchStart = null;
    const touch = event.changedTouches[0];
    if (!this.swipeToClose() || !start || !touch) return;
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    const threshold = 60;
    const away: Record<HkDrawerSide, boolean> = {
      left: dx < -threshold,
      right: dx > threshold,
      top: dy < -threshold,
      bottom: dy > threshold
    };
    if (away[this.side()]) this.close();
  }
}
