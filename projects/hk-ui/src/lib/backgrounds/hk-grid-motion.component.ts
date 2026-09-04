import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { HkCanvasBackground } from './canvas-background.base';

/**
 * A perspective grid receding to a horizon, scrolling toward the viewer.
 *
 * Line spacing is exponential in depth rather than linear, which is what makes
 * it read as perspective instead of a tilted ladder.
 */
@Component({
  selector: 'hk-grid-motion',
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
export class HkGridMotionComponent extends HkCanvasBackground {
  /** Where the horizon sits, as a fraction of height. */
  readonly horizon = input(0.42);
  /** Vertical lines either side of centre. */
  readonly columns = input(16);
  /** Depth bands drawn between the horizon and the viewer. */
  readonly rows = input(14);
  readonly lineWidth = input(1);

  protected frame(t: number): void {
    this.clear();
    const ctx = this.ctx;
    const { r, g, b } = this.rgb(this.color());
    const horizonY = this.height * this.horizon();
    const depth = this.height - horizonY;
    const columns = Math.max(2, this.columns());
    const rows = Math.max(2, this.rows());

    ctx.lineWidth = this.lineWidth();

    // Horizontal bands. `pow` compresses them toward the horizon; the scroll
    // offset is taken modulo 1 so the pattern is seamless as it advances.
    const offset = (t * 0.25) % 1;
    for (let i = 0; i < rows; i++) {
      const p = (i + offset) / rows;
      const y = horizonY + Math.pow(p, 2.6) * depth;
      if (y < horizonY || y > this.height) continue;
      const fade = Math.pow(p, 1.4) * 0.5;
      ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${fade})`;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.width, y);
      ctx.stroke();
    }

    // Verticals converge on the vanishing point.
    const centre = this.width / 2;
    for (let i = -columns; i <= columns; i++) {
      const spread = (i / columns) * this.width * 1.6;
      const fade = 0.42 * (1 - Math.abs(i) / (columns + 2));
      if (fade <= 0) continue;
      ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${fade})`;
      ctx.beginPath();
      ctx.moveTo(centre, horizonY);
      ctx.lineTo(centre + spread, this.height);
      ctx.stroke();
    }

    // Haze along the horizon so the lines do not simply stop.
    const haze = ctx.createLinearGradient(0, horizonY - 40, 0, horizonY + 60);
    haze.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0)`);
    haze.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, 0.14)`);
    haze.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
    ctx.fillStyle = haze;
    ctx.fillRect(0, horizonY - 40, this.width, 100);
  }
}
