import {
  DestroyRef,
  Directive,
  ElementRef,
  NgZone,
  afterNextRender,
  effect,
  inject,
  input,
  signal
} from '@angular/core';

/**
 * Lifecycle shared by every `hk-*` background, whatever it renders with.
 *
 * A decorative background is the easiest thing in a UI library to turn into a
 * battery drain: a full-viewport canvas repainting at 60fps, forever, whether
 * or not anyone can see it. So the loop here is deliberately conservative —
 *
 *   • it runs outside the Angular zone, so a frame never triggers change
 *     detection across the whole app;
 *   • it stops when the element scrolls out of view, and when the tab is
 *     hidden, rather than trusting the browser to throttle it;
 *   • it caps the device pixel ratio, because painting 3x on a phone costs
 *     nine times the fill rate for no visible gain;
 *   • under prefers-reduced-motion it paints one frame and never loops.
 *
 * Subclasses supply a renderer (2D or WebGL) and a `frame()`.
 */
@Directive()
export abstract class HkBackgroundBase {
  /** Animation speed multiplier. 0 freezes on the first frame. */
  readonly speed = input(1);
  /** Base colour, honoured per subclass. */
  readonly color = input('#dc2626');
  /** Opacity of the whole canvas — these sit behind real content. */
  readonly opacity = input(1);
  /** Pauses without unmounting. */
  readonly paused = input(false);

  protected readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  protected readonly zone = inject(NgZone);
  protected readonly destroyRef = inject(DestroyRef);

  protected canvas!: HTMLCanvasElement;
  /** CSS pixels, not device pixels — subclasses work in CSS space. */
  protected width = 0;
  protected height = 0;
  protected dpr = 1;

  /** Pointer position in CSS pixels, or null when the pointer is away. */
  protected pointer: { x: number; y: number } | null = null;
  /** Set true by a subclass that needs pointer tracking. */
  protected trackPointer = false;

  readonly running = signal(false);

  private rafId: number | null = null;
  private startedAt = 0;
  private elapsed = 0;
  private visible = true;
  private reduced = false;
  private ready = false;

  /** Create the rendering context. Return false to give up gracefully. */
  protected abstract createContext(canvas: HTMLCanvasElement): boolean;
  /** Paint one frame. `t` is elapsed seconds, already scaled by `speed`. */
  protected abstract frame(t: number): void;
  /** Called after every resize, before the next frame. */
  protected onResize(): void {}

  constructor() {
    // `paused` and `speed` are live inputs, not construction-time options, so
    // the loop is driven from an effect. Reading them once in `start()` meant
    // flipping `paused` on a running background did nothing at all.
    effect(() => {
      if (this.paused() || this.speed() === 0) this.stop();
      else this.start();
    });
    afterNextRender(() => this.init());
  }

  private init(): void {
    const canvas = this.host.nativeElement.querySelector('canvas');
    if (!canvas) return;
    this.canvas = canvas as HTMLCanvasElement;

    if (!this.createContext(this.canvas)) return;
    this.ready = true;

    this.reduced =
      typeof matchMedia !== 'undefined' &&
      matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.observeSize();
    this.observeVisibility();
    if (this.trackPointer) this.observePointer();

    document.addEventListener('visibilitychange', this.onVisibility);
    this.destroyRef.onDestroy(() => {
      document.removeEventListener('visibilitychange', this.onVisibility);
      this.stop();
    });

    this.resize();
    this.start();
  }

  // ── Sizing ───────────────────────────────────────────────────
  private observeSize(): void {
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => this.resize());
    observer.observe(this.host.nativeElement);
    this.destroyRef.onDestroy(() => observer.disconnect());
  }

  private resize(): void {
    const rect = this.host.nativeElement.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    // Past 2x the extra pixels are invisible but the fill cost is quadratic.
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.width = rect.width;
    this.height = rect.height;
    this.canvas.width = Math.round(rect.width * this.dpr);
    this.canvas.height = Math.round(rect.height * this.dpr);
    this.canvas.style.width = `${rect.width}px`;
    this.canvas.style.height = `${rect.height}px`;

    this.onResize();
    if (!this.running()) this.paintOnce();
  }

  // ── Visibility ───────────────────────────────────────────────
  private observeVisibility(): void {
    if (typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        this.visible = entry.isIntersecting;
        this.visible ? this.start() : this.stop();
      },
      { threshold: 0 }
    );
    observer.observe(this.host.nativeElement);
    this.destroyRef.onDestroy(() => observer.disconnect());
  }

  private readonly onVisibility = (): void => {
    document.hidden ? this.stop() : this.start();
  };

  // ── Pointer ──────────────────────────────────────────────────
  private observePointer(): void {
    const element = this.host.nativeElement;
    const move = (event: PointerEvent): void => {
      const rect = element.getBoundingClientRect();
      this.pointer = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    };
    const leave = (): void => {
      this.pointer = null;
    };
    // Pointer events must never enter the zone — they fire faster than frames.
    this.zone.runOutsideAngular(() => {
      element.addEventListener('pointermove', move, { passive: true });
      element.addEventListener('pointerleave', leave, { passive: true });
    });
    this.destroyRef.onDestroy(() => {
      element.removeEventListener('pointermove', move);
      element.removeEventListener('pointerleave', leave);
    });
  }

  // ── Loop ─────────────────────────────────────────────────────
  protected start(): void {
    if (!this.ready || this.rafId !== null || !this.visible || document.hidden) return;
    if (this.paused() || this.reduced || this.speed() === 0) {
      this.paintOnce();
      return;
    }
    this.startedAt = performance.now() - this.elapsed;
    this.zone.runOutsideAngular(() => {
      this.rafId = requestAnimationFrame(this.tick);
    });
    this.running.set(true);
  }

  protected stop(): void {
    // Nothing running — and nothing to repaint: the canvas keeps its last frame,
    // and `stop()` is also the scroll-out and tab-hidden path, where painting
    // would be pure waste.
    if (this.rafId === null) return;
    cancelAnimationFrame(this.rafId);
    this.rafId = null;
    // Remember where we were so resuming does not jump the animation.
    this.elapsed = performance.now() - this.startedAt;
    this.running.set(false);
  }

  private readonly tick = (now: number): void => {
    this.elapsed = now - this.startedAt;
    this.frame((this.elapsed / 1000) * this.speed());
    this.rafId = requestAnimationFrame(this.tick);
  };

  /** One frame with no loop — for reduced motion, pause and resize. */
  protected paintOnce(): void {
    if (!this.ready || !this.width) return;
    this.frame((this.elapsed / 1000) * this.speed());
  }

  /** Parses #rgb / #rgba / #rrggbb / #rrggbbaa into 0–255 components. */
  protected rgb(hex: string): { r: number; g: number; b: number } {
    const fallback = { r: 220, g: 38, b: 38 };
    let value = hex.trim().replace(/^#/, '');
    // #rgba and #rrggbbaa are ordinary CSS. Left whole, the alpha shifted every
    // channel one byte along and `#dc2626ff` painted as a dim grey-blue.
    if (value.length === 4) value = value.slice(0, 3);
    else if (value.length === 8) value = value.slice(0, 6);
    if (value.length === 3) value = value.replace(/./g, (c) => c + c);
    if (!/^[0-9a-fA-F]{6}$/.test(value)) return fallback;
    const int = parseInt(value, 16);
    return { r: (int >> 16) & 255, g: (int >> 8) & 255, b: int & 255 };
  }

  /** Parses a hex colour into 0–1 components, for shader uniforms. */
  protected rgbUnit(hex: string): [number, number, number] {
    const { r, g, b } = this.rgb(hex);
    return [r / 255, g / 255, b / 255];
  }
}
