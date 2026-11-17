import { DestroyRef, Directive, ElementRef, afterNextRender, inject, input, signal } from '@angular/core';

const EASE = 'cubic-bezier(0.16, 1, 0.3, 1)';

/**
 * Fades and lifts an element into view when it enters the viewport.
 *
 * The styles are bound on the host, so there is no global stylesheet to add:
 *
 *   <div hkReveal [revealDelay]="i * 90">…</div>
 *
 * Tunable per element or page with `--hk-reveal-distance` and
 * `--hk-reveal-duration`. Under prefers-reduced-motion the element is shown
 * immediately — content is never gated behind an animation.
 */
@Directive({
  selector: '[hkReveal]',
  standalone: true,
  host: {
    '[class.is-visible]': 'visible()',
    '[style.opacity]': 'visible() ? 1 : 0',
    '[style.transform]': 'visible() ? "none" : "translateY(var(--hk-reveal-distance, 28px))"',
    '[style.filter]': 'visible() ? "none" : "blur(3px)"',
    '[style.transition]': 'transition',
    '[style.transition-delay.ms]': 'revealDelay()',
    '[style.will-change]': '"opacity, transform"'
  }
})
export class HkRevealDirective {
  /** Milliseconds before the animation starts. Multiply by index to stagger. */
  readonly revealDelay = input(0);
  /** How much must be visible before it fires, 0–1. */
  readonly revealThreshold = input(0.15);
  /** Disconnects after the first reveal; when false it hides again on exit. */
  readonly revealOnce = input(true);

  readonly visible = signal(false);
  readonly transition = ['opacity', 'transform', 'filter']
    .map((prop) => `${prop} var(--hk-reveal-duration, 0.8s) ${EASE}`)
    .join(', ');

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  constructor() {
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      const reduced =
        typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduced || typeof IntersectionObserver === 'undefined') {
        this.visible.set(true);
        return;
      }

      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              this.visible.set(true);
              if (this.revealOnce()) observer.disconnect();
            } else if (!this.revealOnce()) {
              this.visible.set(false);
            }
          }
        },
        { threshold: this.revealThreshold(), rootMargin: '0px 0px -8% 0px' }
      );
      observer.observe(this.host.nativeElement);
      destroyRef.onDestroy(() => observer.disconnect());
    });
  }
}
