import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { HkCanvasBackground } from './canvas-background.base';

/**
 * Stacked sine waves with a filled falloff.
 *
 * Each band sums three sines at unrelated frequencies — one wave alone reads as
 * obviously mechanical, three make the crest wander the way water does.
 */
@Component({
  selector: 'hk-waves',
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
export class HkWavesComponent extends HkCanvasBackground {
  readonly layers = input(4);
  /** Crest height in px. */
  readonly amplitude = input(34);
  /** Horizontal wavelength in px. */
  readonly wavelength = input(280);
  /** Fills under each crest instead of stroking the line only. */
  readonly filled = input(true);

  protected frame(t: number): void {
    this.clear();
    const ctx = this.ctx;
    const { r, g, b } = this.rgb(this.color());
    const layers = Math.max(1, this.layers());
    const amplitude = this.amplitude();
    const k = (Math.PI * 2) / Math.max(20, this.wavelength());
    // One sample every 6px is indistinguishable from per-pixel and costs a
    // sixth as much.
    const step = 6;

    for (let layer = 0; layer < layers; layer++) {
      const depth = layer / layers;
      const baseY = this.height * (0.45 + depth * 0.5);
      const phase = t * (0.7 + layer * 0.22) + layer * 1.7;
      const alpha = 0.3 - depth * 0.16;

      ctx.beginPath();
      ctx.moveTo(0, baseY);
      for (let x = 0; x <= this.width + step; x += step) {
        const y =
          baseY +
          Math.sin(x * k + phase) * amplitude +
          Math.sin(x * k * 0.53 - phase * 1.3) * amplitude * 0.45 +
          Math.sin(x * k * 1.7 + phase * 0.6) * amplitude * 0.18;
        ctx.lineTo(x, y);
      }

      if (this.filled()) {
        ctx.lineTo(this.width, this.height);
        ctx.lineTo(0, this.height);
        ctx.closePath();
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${Math.max(0, alpha) * 0.55})`;
        ctx.fill();
      }

      ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${Math.max(0, alpha)})`;
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }
  }
}
