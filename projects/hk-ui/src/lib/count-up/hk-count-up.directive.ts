import {
  DestroyRef,
  Directive,
  ElementRef,
  afterNextRender,
  effect,
  inject,
  input,
  untracked
} from '@angular/core';

/**
 * Counts up to `countTo` once the element scrolls into view, and animates
 * again from where it is whenever the target changes.
 *
 *   <span hkCountUp [countTo]="8420" countPrefix="$">0</span>
 */
@Directive({
  selector: '[hkCountUp]',
  standalone: true,
  host: { 'aria-live': 'off' }
})
export class HkCountUpDirective {
  readonly countTo = input(0);
  /** Animation length in milliseconds. */
  readonly countDuration = input(1600);
  readonly countPrefix = input('');
  readonly countSuffix = input('');
  /** Fraction digits held during the count — e.g. 1 for "4.9". */
  readonly countDecimals = input(0);

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private started = false;
  private shown = 0;
  private frame: number | null = null;

  constructor() {
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      if (typeof IntersectionObserver === 'undefined') {
        this.started = true;
        this.render(this.countTo());
        return;
      }
      this.render(0);
      const observer = new IntersectionObserver(
        (entries) => {
          if (!entries.some((entry) => entry.isIntersecting)) return;
          observer.disconnect();
          this.started = true;
          this.animateTo(this.countTo());
        },
        { threshold: 0.4 }
      );
      observer.observe(this.host.nativeElement);
      destroyRef.onDestroy(() => observer.disconnect());
    });

    // Retrigger on a new target (or new formatting) once it has been seen.
    effect(() => {
      const target = this.countTo();
      this.countPrefix();
      this.countSuffix();
      this.countDecimals();
      untracked(() => {
        if (this.started) this.animateTo(target);
      });
    });

    destroyRef.onDestroy(() => this.cancel());
  }

  private animateTo(target: number): void {
    this.cancel();
    // Someone who asked for less motion still needs the number.
    const reduced =
      typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      this.render(target);
      return;
    }

    const from = this.shown;
    const start = performance.now();
    const total = this.countDuration();

    const step = (now: number): void => {
      const progress = total > 0 ? Math.min((now - start) / total, 1) : 1;
      // easeOutExpo — fast out of the gate, settles gently on the number.
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      this.render(from + (target - from) * eased);
      this.frame = progress < 1 ? requestAnimationFrame(step) : null;
    };
    this.frame = requestAnimationFrame(step);
  }

  private cancel(): void {
    if (this.frame !== null) cancelAnimationFrame(this.frame);
    this.frame = null;
  }

  private render(value: number): void {
    this.shown = value;
    const decimals = this.countDecimals();
    const shown = decimals > 0 ? value.toFixed(decimals) : Math.round(value).toLocaleString('en-US');
    this.host.nativeElement.textContent = `${this.countPrefix()}${shown}${this.countSuffix()}`;
  }
}
