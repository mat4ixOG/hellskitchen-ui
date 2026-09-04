import {
  Directive,
  ElementRef,
  OnDestroy,
  AfterViewInit,
  inject,
  input
} from '@angular/core';

/**
 * Counts from 0 up to `countTo` once the element scrolls into view.
 *
 *   <span appCountUp [countTo]="120" countSuffix="+"></span>
 */
@Directive({
  selector: '[appCountUp]',
  standalone: true
})
export class CountUpDirective implements AfterViewInit, OnDestroy {
  readonly countTo = input(0);
  readonly countDuration = input(1600);
  readonly countPrefix = input('');
  readonly countSuffix = input('');
  /** Decimal places to keep — e.g. 1 for "4.9". */
  readonly countDecimals = input(0);

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private observer?: IntersectionObserver;
  private frame?: number;

  ngAfterViewInit(): void {
    this.render(0);

    if (typeof IntersectionObserver === 'undefined') {
      this.render(this.countTo());
      return;
    }

    this.observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        this.observer?.disconnect();
        this.run();
      },
      { threshold: 0.4 }
    );

    this.observer.observe(this.host.nativeElement);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    if (this.frame !== undefined) cancelAnimationFrame(this.frame);
  }

  private run(): void {
    // Someone who asked for less motion still needs the number.
    const reduced =
      typeof matchMedia !== 'undefined' &&
      matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      this.render(this.countTo());
      return;
    }

    const start = performance.now();
    const total = this.countDuration();
    const target = this.countTo();

    const step = (now: number) => {
      const progress = Math.min((now - start) / total, 1);
      // easeOutExpo — fast out of the gate, settles gently on the number.
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      this.render(target * eased);
      if (progress < 1) this.frame = requestAnimationFrame(step);
    };

    this.frame = requestAnimationFrame(step);
  }

  private render(value: number): void {
    const decimals = this.countDecimals();
    const shown = decimals > 0
      ? value.toFixed(decimals)
      : Math.round(value).toLocaleString('en-US');
    this.host.nativeElement.textContent = `${this.countPrefix()}${shown}${this.countSuffix()}`;
  }
}
