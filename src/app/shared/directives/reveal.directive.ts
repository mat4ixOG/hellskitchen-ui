import {
  Directive,
  ElementRef,
  OnDestroy,
  AfterViewInit,
  inject,
  input
} from '@angular/core';

/**
 * Fades + lifts an element into view the first time it enters the viewport.
 * The transition itself lives in styles.css under `[data-reveal]`; this only
 * flips the `is-visible` class and applies the stagger delay.
 *
 *   <div appReveal [revealDelay]="120">…</div>
 */
@Directive({
  selector: '[appReveal]',
  standalone: true
})
export class RevealDirective implements AfterViewInit, OnDestroy {
  /** Stagger in milliseconds — handy inside @for loops via $index. */
  readonly revealDelay = input(0);
  /** How much of the element must be visible before it triggers. */
  readonly revealThreshold = input(0.15);

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private observer?: IntersectionObserver;

  ngAfterViewInit(): void {
    const el = this.host.nativeElement;
    el.setAttribute('data-reveal', '');
    el.style.transitionDelay = `${this.revealDelay()}ms`;

    if (typeof IntersectionObserver === 'undefined') {
      el.classList.add('is-visible');
      return;
    }

    this.observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          el.classList.add('is-visible');
          this.observer?.disconnect();
        }
      },
      { threshold: this.revealThreshold(), rootMargin: '0px 0px -8% 0px' }
    );

    this.observer.observe(el);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}
