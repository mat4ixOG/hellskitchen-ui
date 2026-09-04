import {
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  signal,
  untracked
} from '@angular/core';

interface Slide {
  id: string;
  title: string;
  body: string;
  /** Two stops for the slide's own gradient — no image assets to ship. */
  from: string;
  to: string;
  icon: string;
}

@Component({
  selector: 'app-carousel-demo',
  imports: [],
  templateUrl: './carousel-demo.component.html',
  styleUrl: './carousel-demo.component.css'
})
export class CarouselDemoComponent {
  private readonly destroyRef = inject(DestroyRef);

  readonly slides: Slide[] = [
    { id: 'grid', title: 'Data grid', body: 'Virtual scroll, frozen columns and CSV export in one component.', from: '#dc2626', to: '#7f1d1d', icon: 'pi-table' },
    { id: 'charts', title: 'Charts', body: 'Scales and path builders, no d3 in the bundle.', from: '#2a78d6', to: '#1e3a8a', icon: 'pi-chart-line' },
    { id: 'backgrounds', title: 'Backgrounds', body: 'Eight animated canvases that pause when nobody can see them.', from: '#1baf7a', to: '#064e3b', icon: 'pi-sparkles' },
    { id: 'forms', title: 'Forms', body: 'Signal-based inputs that behave with the platform, not around it.', from: '#eb6834', to: '#7c2d12', icon: 'pi-pencil' },
    { id: 'theming', title: 'Theming', body: 'Every visual is a CSS custom property. Restyle without forking.', from: '#4a3aa7', to: '#1e1b4b', icon: 'pi-palette' }
  ];

  readonly index = signal(0);
  readonly loop = signal(true);
  readonly autoplay = signal(true);
  /** ms between advances. Bound, so the control actually drives the timer. */
  readonly interval = signal(3200);

  /** Any of these suspends autoplay without the user turning it off. */
  private readonly hovering = signal(false);
  private readonly focusWithin = signal(false);
  private readonly dragging = signal(false);
  private readonly reducedMotion = signal(false);

  readonly count = computed(() => this.slides.length);
  readonly atStart = computed(() => this.index() === 0);
  readonly atEnd = computed(() => this.index() === this.count() - 1);

  /** Disabled only when looping is off — otherwise the arrows always work. */
  readonly prevDisabled = computed(() => !this.loop() && this.atStart());
  readonly nextDisabled = computed(() => !this.loop() && this.atEnd());

  readonly playing = computed(
    () =>
      this.autoplay() &&
      !this.reducedMotion() &&
      !this.hovering() &&
      !this.focusWithin() &&
      !this.dragging()
  );

  /** Percent offset for the track. One transform moves every slide. */
  readonly offset = computed(() => -this.index() * 100);

  private timer: ReturnType<typeof setInterval> | null = null;
  private pointerStartX: number | null = null;
  private pointerDelta = 0;

  constructor() {
    // Honoured, not assumed: an auto-advancing carousel is the classic
    // reduced-motion offender, and the user has already told the OS.
    if (typeof matchMedia !== 'undefined') {
      const query = matchMedia('(prefers-reduced-motion: reduce)');
      this.reducedMotion.set(query.matches);
      const onChange = (event: MediaQueryListEvent): void => this.reducedMotion.set(event.matches);
      query.addEventListener('change', onChange);
      this.destroyRef.onDestroy(() => query.removeEventListener('change', onChange));
    }

    // The timer is derived state: whenever a reason to pause appears or the
    // interval changes, it is torn down and rebuilt rather than patched.
    effect(() => {
      const running = this.playing();
      const every = Math.max(600, this.interval());
      untracked(() => {
        this.clearTimer();
        if (running) this.timer = setInterval(() => this.next(), every);
      });
    });

    this.destroyRef.onDestroy(() => this.clearTimer());
  }

  private clearTimer(): void {
    if (this.timer !== null) clearInterval(this.timer);
    this.timer = null;
  }

  go(next: number): void {
    const last = this.count() - 1;
    if (next < 0) this.index.set(this.loop() ? last : 0);
    else if (next > last) this.index.set(this.loop() ? 0 : last);
    else this.index.set(next);
  }

  next(): void {
    this.go(this.index() + 1);
  }

  prev(): void {
    this.go(this.index() - 1);
  }

  onEnter(): void {
    this.hovering.set(true);
  }

  onLeave(): void {
    this.hovering.set(false);
  }

  onFocusIn(): void {
    this.focusWithin.set(true);
  }

  onFocusOut(event: FocusEvent): void {
    const next = event.relatedTarget as Node | null;
    // Focus moving between two controls inside the carousel is not "leaving".
    if (next && (event.currentTarget as HTMLElement).contains(next)) return;
    this.focusWithin.set(false);
  }

  onKey(event: KeyboardEvent): void {
    if (event.key === 'ArrowRight') this.next();
    else if (event.key === 'ArrowLeft') this.prev();
    else if (event.key === 'Home') this.index.set(0);
    else if (event.key === 'End') this.index.set(this.count() - 1);
    else return;
    event.preventDefault();
  }

  // ── Drag / swipe ───────────────────────────────────────────────
  onPointerDown(event: PointerEvent): void {
    // Primary button (or touch/pen) only — a right-click must not start a drag.
    if (event.button !== 0) return;
    this.pointerStartX = event.clientX;
    this.pointerDelta = 0;
    this.dragging.set(true);
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  }

  onPointerMove(event: PointerEvent): void {
    if (this.pointerStartX === null) return;
    this.pointerDelta = event.clientX - this.pointerStartX;
  }

  onPointerUp(event: PointerEvent): void {
    if (this.pointerStartX === null) return;
    const element = event.currentTarget as HTMLElement;
    if (element.hasPointerCapture(event.pointerId)) element.releasePointerCapture(event.pointerId);

    // A tenth of the track, so a small wobble while reading is not a swipe.
    const threshold = Math.max(40, element.getBoundingClientRect().width * 0.1);
    if (this.pointerDelta <= -threshold) this.next();
    else if (this.pointerDelta >= threshold) this.prev();

    this.pointerStartX = null;
    this.pointerDelta = 0;
    this.dragging.set(false);
  }

  chip(active: boolean): string {
    return [
      'rounded-md px-2.5 py-1 text-[0.7rem] font-semibold transition cursor-pointer',
      active
        ? 'bg-red-600 text-white'
        : 'bg-slate-200 text-slate-600 hover:bg-slate-300 dark:bg-white/5 dark:text-gray-400 dark:hover:bg-white/10'
    ].join(' ');
  }

  slideStyle(slide: Slide): string {
    return `linear-gradient(135deg, ${slide.from}, ${slide.to})`;
  }
}
