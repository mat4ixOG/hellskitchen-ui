import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { HkCanvasBackground } from './canvas-background.base';

/**
 * Sweeping light beams. Each is a rotated linear gradient with a soft falloff,
 * added together so overlaps brighten the way real light does.
 */
@Component({
  selector: 'hk-beams',
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
export class HkBeamsComponent extends HkCanvasBackground {
  readonly beams = input(6);
  /** Beam tilt in degrees from vertical. */
  readonly angle = input(-22);
  /** Beam width as a fraction of the canvas width. */
  readonly beamWidth = input(0.1);

  protected frame(t: number): void {
    this.clear();
    const ctx = this.ctx;
    const { r, g, b } = this.rgb(this.color());
    const count = Math.max(1, this.beams());
    const radians = (this.angle() * Math.PI) / 180;
    const span = Math.hypot(this.width, this.height);
    const width = Math.max(4, this.width * this.beamWidth());

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.translate(this.width / 2, this.height / 2);
    ctx.rotate(radians);

    for (let i = 0; i < count; i++) {
      // Each beam drifts at its own rate and wraps, so the set never lines up
      // into a visible repeating block.
      const phase = (t * (0.06 + (i % 3) * 0.02) + i / count) % 1;
      const x = (phase - 0.5) * span * 1.6;
      const intensity = 0.1 + 0.14 * Math.sin(t * 0.6 + i);

      const gradient = ctx.createLinearGradient(x - width / 2, 0, x + width / 2, 0);
      gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0)`);
      gradient.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, ${Math.max(0, intensity)})`);
      gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);

      ctx.fillStyle = gradient;
      ctx.fillRect(x - width / 2, -span, width, span * 2);
    }

    ctx.restore();
  }
}
