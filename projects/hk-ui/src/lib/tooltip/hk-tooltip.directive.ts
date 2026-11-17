import { DOCUMENT } from '@angular/common';
import { DestroyRef, Directive, ElementRef, Renderer2, effect, inject, input } from '@angular/core';

export type HkTooltipPlacement = 'top' | 'bottom' | 'left' | 'right';

const HK_TOOLTIP_OPPOSITE: Record<HkTooltipPlacement, HkTooltipPlacement> = {
  top: 'bottom',
  bottom: 'top',
  left: 'right',
  right: 'left'
};
const HK_TOOLTIP_GAP = 8;

let nextTooltipId = 0;

/**
 * Tooltip on hover *and* keyboard focus. The bubble is created only when it is
 * first shown — never during construction — so the directive is SSR-safe.
 */
@Directive({
  selector: '[hkTooltip]',
  standalone: true,
  host: {
    '(mouseenter)': 'scheduleShow()',
    '(mouseleave)': 'hide()',
    '(focus)': 'show()',
    '(blur)': 'hide()',
    '(keydown.escape)': 'hide()'
  }
})
export class HkTooltipDirective {
  /** Tooltip text. Empty disables it. */
  readonly hkTooltip = input('');
  /** Preferred side; flips at the viewport edge. */
  readonly hkTooltipPlacement = input<HkTooltipPlacement>('top');
  /** Milliseconds before it appears on hover. */
  readonly hkTooltipDelay = input(400);
  readonly hkTooltipDisabled = input(false);

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly renderer = inject(Renderer2);
  private readonly document = inject(DOCUMENT);
  private readonly id = `hk-tooltip-${nextTooltipId++}`;
  private bubble: HTMLElement | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    // Text changing while shown updates in place; disabling hides it.
    effect(() => {
      const text = this.hkTooltip();
      if (this.hkTooltipDisabled() || !text) this.hide();
      else if (this.bubble) this.bubble.textContent = text;
    });
    inject(DestroyRef).onDestroy(() => {
      this.hide();
    });
  }

  scheduleShow(): void {
    this.clearTimer();
    this.timer = setTimeout(() => this.show(), this.hkTooltipDelay());
  }

  show(): void {
    this.clearTimer();
    const text = this.hkTooltip();
    if (this.hkTooltipDisabled() || !text || this.bubble) return;

    const host = this.host.nativeElement;
    const bubble: HTMLElement = this.renderer.createElement('div');
    bubble.id = this.id;
    bubble.setAttribute('role', 'tooltip');
    bubble.textContent = text;
    bubble.style.cssText = [
      'position:fixed',
      'z-index:1000',
      'left:0',
      'top:0',
      'max-width:16rem',
      'padding:0.3rem 0.55rem',
      'border-radius:0.5rem',
      'background:var(--hk-tooltip-bg, #0f172a)',
      'color:var(--hk-tooltip-text, #ffffff)',
      'font-size:0.72rem',
      'line-height:1.1rem',
      'font-weight:500',
      'box-shadow:0 8px 24px rgb(15 23 42 / 0.25)',
      'pointer-events:none',
      'white-space:normal'
    ].join(';');

    // When the host already says this as its name, a description would read it twice.
    const label = (host.getAttribute('aria-label') ?? host.textContent ?? '').trim();
    if (label === text.trim()) {
      bubble.setAttribute('aria-hidden', 'true');
    } else {
      const described = host.getAttribute('aria-describedby');
      this.renderer.setAttribute(host, 'aria-describedby', described ? `${described} ${this.id}` : this.id);
    }

    this.renderer.appendChild(this.document.body, bubble);
    this.bubble = bubble;
    this.position(host.getBoundingClientRect(), bubble);
  }

  hide(): void {
    this.clearTimer();
    if (!this.bubble) return;
    this.renderer.removeChild(this.document.body, this.bubble);
    this.bubble = null;
    const host = this.host.nativeElement;
    const rest = (host.getAttribute('aria-describedby') ?? '')
      .split(' ')
      .filter((id) => id && id !== this.id)
      .join(' ');
    if (rest) this.renderer.setAttribute(host, 'aria-describedby', rest);
    else this.renderer.removeAttribute(host, 'aria-describedby');
  }

  private position(anchor: DOMRect, bubble: HTMLElement): void {
    const width = bubble.offsetWidth;
    const height = bubble.offsetHeight;
    const view = this.document.defaultView;
    const vw = view?.innerWidth ?? 0;
    const vh = view?.innerHeight ?? 0;

    const at = (side: HkTooltipPlacement): { left: number; top: number } => {
      switch (side) {
        case 'top':
          return { left: anchor.left + anchor.width / 2 - width / 2, top: anchor.top - height - HK_TOOLTIP_GAP };
        case 'bottom':
          return { left: anchor.left + anchor.width / 2 - width / 2, top: anchor.bottom + HK_TOOLTIP_GAP };
        case 'left':
          return { left: anchor.left - width - HK_TOOLTIP_GAP, top: anchor.top + anchor.height / 2 - height / 2 };
        case 'right':
          return { left: anchor.right + HK_TOOLTIP_GAP, top: anchor.top + anchor.height / 2 - height / 2 };
      }
    };
    const fits = ({ left, top }: { left: number; top: number }): boolean =>
      left >= 0 && top >= 0 && left + width <= vw && top + height <= vh;

    const preferred = this.hkTooltipPlacement();
    let point = at(preferred);
    if (!fits(point)) {
      const flipped = at(HK_TOOLTIP_OPPOSITE[preferred]);
      if (fits(flipped)) point = flipped;
    }
    bubble.style.left = `${Math.max(0, point.left)}px`;
    bubble.style.top = `${Math.max(0, point.top)}px`;
  }

  private clearTimer(): void {
    if (this.timer !== null) clearTimeout(this.timer);
    this.timer = null;
  }
}
