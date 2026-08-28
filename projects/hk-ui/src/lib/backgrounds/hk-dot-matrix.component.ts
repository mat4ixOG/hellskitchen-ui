import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { HkCanvasBackground } from './canvas-background.base';

/**
 * A grid of dots that swell in a travelling wave, and bulge toward the pointer.
 *
 * Only dots inside the pointer radius do the distance maths; the rest take a
 * cheap wave lookup, which keeps a dense grid affordable.
 */
@Component({
  selector: 'hk-dot-matrix',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<canvas [style.opacity]="opacity()" aria-hidden="true"></canvas>`,
  styles: [`
    @layer components {
      :host { display: block; position: relative; overflow: hidden; isolation: isolate; }
    }
    canvas { display: block; width: 100%; height: 100%; }
  `]
})
export class HkDotMatrixComponent extends HkCanvasBackground {
  /** Distance between dot centres, px. */
  readonly gap = input(26);
  readonly dotSize = input(1.6);
  /** Radius the pointer influences, px. 0 disables the interaction. */
  readonly influence = input(140);
  /** Amplitude of the idle wave, 0–1. */
  readonly wave = input(0.5);

  protected override trackPointer = true;

  protected frame(t: number): void {
    this.clear();
    const ctx = this.ctx;
    const { r, g, b } = this.rgb(this.color());
    const gap = Math.max(6, this.gap());
    const base = this.dotSize();
    const influence = this.influence();
    const wave = this.wave();
    const influenceSq = influence * influence;

    const cols = Math.ceil(this.width / gap) + 1;
    const rows = Math.ceil(this.height / gap) + 1;

    ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;

    for (let row = 0; row < rows; row++) {
      const y = row * gap;
      for (let col = 0; col < cols; col++) {
        const x = col * gap;

        // Diagonal travelling wave — one sin per dot.
        let scale = 1 + wave * Math.sin(t * 1.6 - (col + row) * 0.35);
        let alpha = 0.28 + 0.22 * scale;

        if (this.pointer && influence > 0) {
          const dx = x - this.pointer.x;
          const dy = y - this.pointer.y;
          const distSq = dx * dx + dy * dy;
          if (distSq < influenceSq) {
            const falloff = 1 - Math.sqrt(distSq) / influence;
            scale += falloff * 2.4;
            alpha += falloff * 0.6;
          }
        }

        const radius = base * Math.max(0.1, scale);
        ctx.globalAlpha = Math.min(1, alpha);
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.globalAlpha = 1;
  }
}
