import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { HkCanvasBackground } from './canvas-background.base';

/**
 * An ordered-dither gradient — the banded, retro look.
 *
 * Drawn as chunky cells rather than per-pixel: a genuine per-pixel dither over
 * a full-screen canvas means writing millions of bytes into an ImageData every
 * frame, which is exactly the kind of thing that makes a background library
 * unusable. A 4px cell is visually identical here and costs a sixteenth.
 */
@Component({
  selector: 'hk-dither',
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
export class HkDitherComponent extends HkCanvasBackground {
  /** Cell edge in px. Larger is chunkier and cheaper. */
  readonly pixelSize = input(4);
  /** Extra sparkle, 0–1. */
  readonly noise = input(0.08);
  /** Cell opacity. Dithering must stay binary per cell, so subtlety comes
   *  from the alpha and the coverage rather than from softening the edges. */
  readonly intensity = input(0.34);
  /** Raises the threshold so fewer cells light up. 0–1, higher is sparser. */
  readonly sparsity = input(0.34);

  /** Bayer 4×4 — the classic ordered-dither threshold matrix. */
  private static readonly BAYER = [
    [0, 8, 2, 10],
    [12, 4, 14, 6],
    [3, 11, 1, 9],
    [15, 7, 13, 5]
  ];

  protected frame(t: number): void {
    this.clear();
    const ctx = this.ctx;
    const { r, g, b } = this.rgb(this.color());
    const cell = Math.max(2, this.pixelSize());
    const noise = this.noise();
    const cols = Math.ceil(this.width / cell);
    const rows = Math.ceil(this.height / cell);

    ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
    ctx.globalAlpha = Math.max(0, Math.min(1, this.intensity()));
    const sparsity = this.sparsity();

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        // A slow diagonal ramp with a couple of sines so the bands move.
        const u = col / cols;
        const v = row / rows;
        // Centred lower than 0.5 so the field is mostly empty, with the
        // pattern reading as texture rather than as a filled surface.
        let level =
          0.5 - sparsity +
          0.3 * Math.sin((u + v) * 3.2 + t * 0.8) +
          0.16 * Math.sin(v * 6.1 - t * 0.5);

        if (noise > 0) {
          // Cheap hash — deterministic per cell, no Math.random per frame.
          const h = Math.sin(col * 12.9898 + row * 78.233) * 43758.5453;
          level += (h - Math.floor(h) - 0.5) * noise;
        }

        const threshold = (HkDitherComponent.BAYER[row & 3][col & 3] + 0.5) / 16;
        if (level > threshold) {
          ctx.fillRect(col * cell, row * cell, cell, cell);
        }
      }
    }

    ctx.globalAlpha = 1;
  }
}
