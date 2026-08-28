import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  NgZone,
  afterNextRender,
  effect,
  inject,
  input
} from '@angular/core';

/**
 * A soft light that follows the pointer, over an optional static grid.
 *
 * Deliberately not canvas: this is one radial gradient, so the GPU can composite
 * it and the only per-move work is writing two CSS variables. Those writes are
 * coalesced to one per animation frame and never enter the Angular zone, so
 * moving the mouse across it costs nothing measurable.
 */
@Component({
  selector: 'hk-spotlight',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="hk-spot-layer" [style.opacity]="opacity()" aria-hidden="true"></div>
    @if (grid()) {
      <div class="hk-spot-grid" aria-hidden="true"></div>
    }
    <ng-content />
  `,
  styles: [`
    @layer components {
      :host {
        display: block;
        position: relative;
        overflow: hidden;
        isolation: isolate;
        --hk-spot-x: 50%;
        --hk-spot-y: 50%;
        --hk-spot-size: 320px;
        --hk-spot-color: 220 38 38;
        --hk-spot-grid: 32px;
      }
    }
    .hk-spot-layer, .hk-spot-grid {
      position: absolute;
      inset: 0;
      pointer-events: none;
    }
    .hk-spot-layer {
      background: radial-gradient(
        var(--hk-spot-size) circle at var(--hk-spot-x) var(--hk-spot-y),
        rgb(var(--hk-spot-color) / 0.22),
        rgb(var(--hk-spot-color) / 0.08) 40%,
        transparent 70%
      );
      transition: opacity 200ms ease;
    }
    .hk-spot-grid {
      z-index: -1;
      background-image:
        linear-gradient(to right, rgb(var(--hk-spot-color) / 1) 1px, transparent 1px),
        linear-gradient(to bottom, rgb(var(--hk-spot-color) / 1) 1px, transparent 1px);
      background-size: var(--hk-spot-grid) var(--hk-spot-grid);
      opacity: 0.22;
      /* The grid only exists where the light falls. */
      mask-image: radial-gradient(
        var(--hk-spot-size) circle at var(--hk-spot-x) var(--hk-spot-y),
        #000 20%,
        transparent 75%
      );
    }
    @media (prefers-reduced-motion: reduce) {
      .hk-spot-layer { transition: none; }
    }
  `]
})
export class HkSpotlightComponent {
  readonly color = input('#dc2626');
  /** Light radius in px. */
  readonly size = input(320);
  readonly opacity = input(1);
  /** Draws a grid revealed only inside the light. */
  readonly grid = input(true);
  /** Grid cell size in px. */
  readonly gridSize = input(32);

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly zone = inject(NgZone);
  private readonly destroyRef = inject(DestroyRef);

  private frameId: number | null = null;
  private pending: { x: number; y: number } | null = null;

  constructor() {
    // Re-applied whenever the inputs move, not just once on first render.
    effect(() => this.applyStatics());
    afterNextRender(() => this.attach());
  }

  private attach(): void {
    const element = this.host.nativeElement;

    const move = (event: PointerEvent): void => {
      const rect = element.getBoundingClientRect();
      this.pending = { x: event.clientX - rect.left, y: event.clientY - rect.top };
      if (this.frameId !== null) return;
      // Pointer events outrun frames; collapse them to one write per frame.
      this.frameId = requestAnimationFrame(() => {
        this.frameId = null;
        if (!this.pending) return;
        element.style.setProperty('--hk-spot-x', `${this.pending.x}px`);
        element.style.setProperty('--hk-spot-y', `${this.pending.y}px`);
      });
    };

    const leave = (): void => {
      element.style.setProperty('--hk-spot-x', '50%');
      element.style.setProperty('--hk-spot-y', '50%');
    };

    this.zone.runOutsideAngular(() => {
      element.addEventListener('pointermove', move, { passive: true });
      element.addEventListener('pointerleave', leave, { passive: true });
    });

    this.destroyRef.onDestroy(() => {
      if (this.frameId !== null) cancelAnimationFrame(this.frameId);
      element.removeEventListener('pointermove', move);
      element.removeEventListener('pointerleave', leave);
    });
  }

  private applyStatics(): void {
    const element = this.host.nativeElement;
    const hex = this.color().replace('#', '');
    const full = hex.length === 3 ? hex.split('').map((c) => c + c).join('') : hex;
    const int = parseInt(full, 16);
    // Space-separated on purpose: these feed `rgb(var(--hk-spot-color) / a)`,
    // and mixing legacy commas with the `/` alpha form invalidates the rule.
    const rgb = Number.isNaN(int)
      ? '220 38 38'
      : `${(int >> 16) & 255} ${(int >> 8) & 255} ${int & 255}`;
    element.style.setProperty('--hk-spot-color', rgb);
    element.style.setProperty('--hk-spot-size', `${this.size()}px`);
    element.style.setProperty('--hk-spot-grid', `${this.gridSize()}px`);
  }
}
