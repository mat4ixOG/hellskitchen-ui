import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  afterNextRender,
  computed,
  contentChildren,
  effect,
  forwardRef,
  inject,
  input,
  model,
  output,
  signal,
  untracked
} from '@angular/core';

/** One slide of an `hk-carousel`: a labelled group, inert while off-screen. */
@Component({
  selector: 'hk-slide',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'hk-slide',
    role: 'group',
    'aria-roledescription': 'slide',
    '[attr.aria-label]': 'position() + 1 + " of " + carousel.count()',
    '[attr.aria-hidden]': 'active() ? null : "true"',
    '[attr.inert]': 'active() ? null : ""'
  },
  template: `<ng-content />`,
  styles: `
    @layer components {
      :host { display: block; width: 100%; flex-shrink: 0; box-sizing: border-box; }
    }
  `
})
export class HkCarouselSlideComponent {
  protected readonly carousel = inject(forwardRef(() => HkCarouselComponent));
  readonly position = computed(() => this.carousel.slides().indexOf(this));
  readonly active = computed(() => this.carousel.index() === this.position());
}

/**
 * A carousel whose whole track moves on one transform. Autoplay suspends on
 * hover, on focus anywhere inside and mid-drag, and never starts under
 * prefers-reduced-motion.
 */
@Component({
  selector: 'hk-carousel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'hk-carousel-host',
    // The region is the host, so an aria-label put on <hk-carousel> names it.
    role: 'region',
    'aria-roledescription': 'carousel'
  },
  template: `
    <section class="hk-carousel" tabindex="0"
      (mouseenter)="onEnter()" (mouseleave)="onLeave()"
      (focusin)="onFocusIn()" (focusout)="onFocusOut($event)"
      (keydown)="onKey($event)"
      (pointerdown)="onPointerDown($event)"
      (pointermove)="onPointerMove($event)"
      (pointerup)="onPointerUp($event)"
      (pointercancel)="onPointerUp($event)">

      <div class="hk-carousel-track" [style.transform]="'translate3d(' + offset() + '%, 0, 0)'">
        <ng-content />
      </div>

      @if (showArrows()) {
        <button type="button" class="hk-carousel-arrow is-prev" (click)="prev()"
          [disabled]="prevDisabled()" aria-label="Previous slide">
          <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 3.5 5.5 8l4.5 4.5" /></svg>
        </button>
        <button type="button" class="hk-carousel-arrow is-next" (click)="next()"
          [disabled]="nextDisabled()" aria-label="Next slide">
          <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 3.5 10.5 8 6 12.5" /></svg>
        </button>
      }
    </section>

    <div class="hk-carousel-footer">
      @if (showDots()) {
        <div class="hk-carousel-dots" role="tablist" aria-label="Choose slide">
          @for (slide of slides(); track slide) {
            <button type="button" role="tab" class="hk-carousel-dot"
              [class.is-active]="index() === $index"
              [attr.aria-selected]="index() === $index"
              [attr.aria-label]="'Slide ' + ($index + 1)"
              (click)="go($index)"></button>
          }
        </div>
      }
      <!-- Polite, not assertive: the slide changing is not an alert. -->
      <p class="hk-carousel-status" aria-live="polite">{{ index() + 1 }} of {{ count() }}</p>
    </div>
  `,
  styles: `
    @layer components {
      :host {
        --hk-carousel-surface: #f8fafc;
        --hk-carousel-line: #e2e8f0;
        --hk-carousel-dot: #cbd5e1;
        --hk-carousel-dot-hover: #94a3b8;
        --hk-carousel-muted: #64748b;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }
      :host-context(.dark) {
        --hk-carousel-surface: rgb(255 255 255 / 0.03);
        --hk-carousel-line: rgb(255 255 255 / 0.1);
        --hk-carousel-dot: rgb(255 255 255 / 0.15);
        --hk-carousel-dot-hover: rgb(255 255 255 / 0.25);
        --hk-carousel-muted: #6b7280;
      }

      /* A drag is a drag, not a text selection. */
      .hk-carousel {
        position: relative;
        overflow: hidden;
        border: 1px solid var(--hk-carousel-line);
        border-radius: 1rem;
        background: var(--hk-carousel-surface);
        touch-action: pan-y;
        user-select: none;
      }
      .hk-carousel:focus-visible {
        outline: 2px solid var(--hk-accent, #dc2626);
        outline-offset: 2px;
      }

      /* The track is the only animated thing. */
      .hk-carousel-track {
        display: flex;
        transition: transform var(--hk-carousel-duration, 420ms) var(--hk-carousel-ease, cubic-bezier(0.22, 1, 0.36, 1));
        will-change: transform;
      }

      .hk-carousel-arrow {
        position: absolute;
        top: 50%;
        translate: 0 -50%;
        display: grid;
        place-items: center;
        width: 2rem;
        height: 2rem;
        padding: 0;
        border-radius: 9999px;
        cursor: pointer;
        color: rgb(51 65 85);
        background: var(--hk-carousel-arrow-bg, rgb(255 255 255 / 0.9));
        border: 1px solid rgb(226 232 240);
        box-shadow: 0 2px 8px rgb(0 0 0 / 0.08);
        transition: background 160ms, color 160ms, opacity 160ms;
      }
      .hk-carousel-arrow.is-prev { left: 0.75rem; }
      .hk-carousel-arrow.is-next { right: 0.75rem; }
      .hk-carousel-arrow:hover:not(:disabled) { background: #fff; color: rgb(15 23 42); }
      .hk-carousel-arrow:disabled { opacity: 0.3; cursor: not-allowed; }
      .hk-carousel-arrow:focus-visible { outline: 2px solid var(--hk-accent, #dc2626); outline-offset: 2px; }
      :host-context(.dark) .hk-carousel-arrow {
        color: rgb(209 213 219);
        background: var(--hk-carousel-arrow-bg, rgb(15 15 16 / 0.85));
        border-color: rgb(255 255 255 / 0.12);
      }
      :host-context(.dark) .hk-carousel-arrow:hover:not(:disabled) { background: rgb(24 24 27); color: #fff; }

      .hk-carousel-footer { display: flex; align-items: center; gap: 0.75rem; }
      .hk-carousel-dots { display: flex; gap: 0.375rem; }
      .hk-carousel-dot {
        width: 0.5rem;
        height: 0.5rem;
        padding: 0;
        border: 0;
        border-radius: 9999px;
        background: var(--hk-carousel-dot);
        cursor: pointer;
        transition: all 300ms ease;
      }
      .hk-carousel-dot:hover { background: var(--hk-carousel-dot-hover); }
      .hk-carousel-dot.is-active { width: 1.5rem; background: var(--hk-accent, #dc2626); }
      .hk-carousel-dot:focus-visible { outline: 2px solid var(--hk-accent, #dc2626); outline-offset: 2px; }

      .hk-carousel-status {
        margin: 0 0 0 auto;
        font-size: 0.7rem;
        color: var(--hk-carousel-muted);
      }

      @media (prefers-reduced-motion: reduce) {
        .hk-carousel-track, .hk-carousel-dot { transition: none; }
      }
    }
  `
})
export class HkCarouselComponent {
  /** Active slide. Two-way bindable. */
  readonly index = model(0);
  /** Advance on a timer. Suspended by hover, focus and drag, and ignored under reduced motion. */
  readonly autoplay = input(false);
  /** Milliseconds between advances. Floors at 600. */
  readonly interval = input(4000);
  /** Wrap past the ends. When false, the arrows disable at the edges instead. */
  readonly loop = input(true);
  /** Pointer dragging. */
  readonly swipe = input(true);
  readonly showArrows = input(true);
  readonly showDots = input(true);

  /** Emits the new index. */
  readonly changed = output<number>();

  readonly slides = contentChildren(HkCarouselSlideComponent);
  readonly count = computed(() => this.slides().length);
  readonly atStart = computed(() => this.index() === 0);
  readonly atEnd = computed(() => this.index() >= this.count() - 1);
  readonly prevDisabled = computed(() => !this.loop() && this.atStart());
  readonly nextDisabled = computed(() => !this.loop() && this.atEnd());
  /** Percent offset for the track. One transform moves every slide. */
  readonly offset = computed(() => -this.index() * 100);

  private readonly hovering = signal(false);
  private readonly focusWithin = signal(false);
  private readonly dragging = signal(false);
  private readonly reducedMotion = signal(false);

  /** Whether autoplay is actually running right now. */
  readonly playing = computed(
    () =>
      this.autoplay() &&
      !this.reducedMotion() &&
      !this.hovering() &&
      !this.focusWithin() &&
      !this.dragging()
  );

  private timer: ReturnType<typeof setInterval> | null = null;
  private pointerStartX: number | null = null;
  private pointerDelta = 0;

  constructor() {
    const destroyRef = inject(DestroyRef);

    // Read after render, not during construction, so SSR never touches matchMedia.
    afterNextRender(() => {
      if (typeof matchMedia === 'undefined') return;
      const query = matchMedia('(prefers-reduced-motion: reduce)');
      this.reducedMotion.set(query.matches);
      const onChange = (event: MediaQueryListEvent): void => this.reducedMotion.set(event.matches);
      query.addEventListener('change', onChange);
      destroyRef.onDestroy(() => query.removeEventListener('change', onChange));
    });

    // The timer is derived state: torn down and rebuilt whenever a reason to
    // pause appears or the interval changes.
    effect(() => {
      const running = this.playing();
      const every = Math.max(600, this.interval());
      untracked(() => {
        this.clearTimer();
        if (running) this.timer = setInterval(() => this.next(), every);
      });
    });

    destroyRef.onDestroy(() => this.clearTimer());
  }

  private clearTimer(): void {
    if (this.timer !== null) clearInterval(this.timer);
    this.timer = null;
  }

  private setIndex(next: number): void {
    if (next === this.index()) return;
    this.index.set(next);
    this.changed.emit(next);
  }

  /** Jump to a slide, clamped or wrapped by loop. */
  go(next: number): void {
    const last = Math.max(0, this.count() - 1);
    if (next < 0) this.setIndex(this.loop() ? last : 0);
    else if (next > last) this.setIndex(this.loop() ? 0 : last);
    else this.setIndex(next);
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
    else if (event.key === 'Home') this.go(0);
    else if (event.key === 'End') this.go(this.count() - 1);
    else return;
    event.preventDefault();
  }

  onPointerDown(event: PointerEvent): void {
    // Primary button (or touch/pen) only — a right-click must not start a drag.
    if (!this.swipe() || event.button !== 0) return;
    // A press on an arrow or dot is a click, not the start of a swipe.
    if ((event.target as HTMLElement).closest?.('button')) return;
    this.pointerStartX = event.clientX;
    this.pointerDelta = 0;
    this.dragging.set(true);
    (event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId);
  }

  onPointerMove(event: PointerEvent): void {
    if (this.pointerStartX === null) return;
    this.pointerDelta = event.clientX - this.pointerStartX;
  }

  onPointerUp(event: PointerEvent): void {
    if (this.pointerStartX === null) return;
    const element = event.currentTarget as HTMLElement;
    if (element.hasPointerCapture?.(event.pointerId)) element.releasePointerCapture(event.pointerId);

    // A tenth of the track, so a small wobble while reading is not a swipe.
    const threshold = Math.max(40, element.getBoundingClientRect().width * 0.1);
    if (this.pointerDelta <= -threshold) this.next();
    else if (this.pointerDelta >= threshold) this.prev();

    this.pointerStartX = null;
    this.pointerDelta = 0;
    this.dragging.set(false);
  }
}
