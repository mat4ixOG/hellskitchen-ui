import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  inject,
  input,
  signal
} from '@angular/core';

/**
 * A metric tile: a value that counts up into view, a delta whose tone follows
 * its sign, and a slot for a sparkline (`<svg hkStatSpark>`), which is drawn
 * in the delta's colour through `currentColor`.
 */
@Component({
  selector: 'hk-stat',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p class="hk-stat-label">{{ label() }}</p>
    <p class="hk-stat-value">
      <!-- The animation is decoration; the real figure is in the DOM from the start. -->
      <span aria-hidden="true">{{ shown() }}</span>
      <span class="hk-sr">{{ final() }}</span>
    </p>
    <div class="hk-stat-foot">
      @if (delta() !== null) {
        <span class="hk-stat-delta" [attr.data-dir]="direction()">
          {{ direction() === 'up' ? '▲' : '▼' }} {{ absDelta() }}%
        </span>
      }
      <span class="hk-stat-spark" [attr.data-dir]="direction()">
        <ng-content select="[hkStatSpark]" />
      </span>
    </div>
  `,
  styleUrl: './hk-stat.component.css'
})
export class HkStatComponent {
  readonly label = input('');
  readonly value = input(0);
  /** Change versus the previous period; the sign picks the tone. */
  readonly delta = input<number | null>(null);
  readonly prefix = input('');
  readonly suffix = input('');
  readonly decimals = input(0);
  /** Animates the value into view. */
  readonly countUp = input(true);

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly current = signal(0);
  private readonly settled = signal(false);
  private frame: number | null = null;

  readonly direction = computed(() => ((this.delta() ?? 0) >= 0 ? 'up' : 'down'));
  readonly absDelta = computed(() => Math.abs(this.delta() ?? 0));
  readonly final = computed(() => this.format(this.value()));
  readonly shown = computed(() =>
    !this.countUp() || this.settled() ? this.final() : this.format(this.current())
  );

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      if (!this.countUp() || typeof IntersectionObserver === 'undefined') {
        this.settled.set(true);
        return;
      }
      const observer = new IntersectionObserver(
        (entries) => {
          if (!entries.some((entry) => entry.isIntersecting)) return;
          observer.disconnect();
          this.run();
        },
        { threshold: 0.4 }
      );
      observer.observe(this.host.nativeElement);
      destroyRef.onDestroy(() => {
        observer.disconnect();
        if (this.frame !== null) cancelAnimationFrame(this.frame);
      });
    });
  }

  private run(): void {
    // Someone who asked for less motion still needs the number.
    if (typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.settled.set(true);
      return;
    }
    const start = performance.now();
    const total = 1600;
    const step = (now: number): void => {
      const progress = Math.min((now - start) / total, 1);
      // easeOutExpo — fast out of the gate, settles gently on the number.
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      this.current.set(this.value() * eased);
      if (progress < 1) this.frame = requestAnimationFrame(step);
      else this.settled.set(true);
    };
    this.frame = requestAnimationFrame(step);
  }

  private format(value: number): string {
    const decimals = this.decimals();
    const shown = decimals > 0 ? value.toFixed(decimals) : Math.round(value).toLocaleString('en-US');
    return `${this.prefix()}${shown}${this.suffix()}`;
  }
}
