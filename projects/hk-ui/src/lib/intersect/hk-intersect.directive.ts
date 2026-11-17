import { DestroyRef, Directive, ElementRef, afterNextRender, inject, input, output } from '@angular/core';

/**
 * Emits when the host enters or leaves the viewport (or `intersectRoot`) —
 * the primitive behind lazy loading, infinite scroll and scroll-spy.
 *
 *   <div hkIntersect [intersectThreshold]="0.5" (entered)="load()" (left)="pause()"></div>
 */
@Directive({
  selector: '[hkIntersect]',
  standalone: true
})
export class HkIntersectDirective {
  /** Visible fraction that counts as intersecting, 0–1. */
  readonly intersectThreshold = input(0);
  /** Scroll container. Defaults to the viewport. */
  readonly intersectRoot = input<Element | null>(null);
  /** Disconnects after the first entry. */
  readonly intersectOnce = input(false);

  readonly entered = output<IntersectionObserverEntry>();
  readonly left = output<IntersectionObserverEntry>();

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  constructor() {
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      if (typeof IntersectionObserver === 'undefined') return;

      // Only transitions are reported: the observer's first callback for an
      // element that starts off-screen is not a "left".
      let inside = false;
      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            const showing = entry.isIntersecting && entry.intersectionRatio >= this.intersectThreshold();
            if (showing === inside) continue;
            inside = showing;
            if (showing) {
              this.entered.emit(entry);
              if (this.intersectOnce()) observer.disconnect();
            } else {
              this.left.emit(entry);
            }
          }
        },
        { root: this.intersectRoot(), threshold: this.intersectThreshold() }
      );
      observer.observe(this.host.nativeElement);
      destroyRef.onDestroy(() => observer.disconnect());
    });
  }
}
