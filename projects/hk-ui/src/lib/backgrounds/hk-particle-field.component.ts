import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { HkCanvasBackground } from './canvas-background.base';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
}

/**
 * Drifting particles that link when they come close, and part around the
 * pointer.
 *
 * The link pass is the expensive half — naively it is O(n²) every frame, which
 * is why most versions of this crawl past a few hundred particles. This one
 * bins into a spatial grid sized to the link distance, so each particle only
 * tests its nine neighbouring cells.
 */
@Component({
  selector: 'hk-particle-field',
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
export class HkParticleFieldComponent extends HkCanvasBackground {
  /** Particles per 10,000 css px². Scaled by area, so density reads the same at any size. */
  readonly density = input(0.9);
  /** Max px between two particles for a link to be drawn. 0 disables linking. */
  readonly linkDistance = input(110);
  /** Radius in px within which the pointer pushes particles away. */
  readonly repelRadius = input(120);
  readonly particleSize = input(1.8);

  protected override trackPointer = true;

  private particles: Particle[] = [];
  private cells = new Map<number, number[]>();
  private cols = 0;

  protected override onCanvasResize(): void {
    const target = Math.round((this.width * this.height) / 10000 * this.density());
    const count = Math.max(0, Math.min(1200, target));
    const particles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      const existing = this.particles[i];
      particles.push(
        existing ?? {
          x: Math.random() * this.width,
          y: Math.random() * this.height,
          vx: (Math.random() - 0.5) * 14,
          vy: (Math.random() - 0.5) * 14,
          r: this.particleSize() * (0.6 + Math.random() * 0.8)
        }
      );
    }
    this.particles = particles;
  }

  protected frame(t: number): void {
    if (!this.particles.length) this.onResize();
    this.clear();

    const ctx = this.ctx;
    const { r, g, b } = this.rgb(this.color());
    const link = this.linkDistance();
    const repel = this.repelRadius();
    // Fixed step: motion must not depend on frame rate, or it speeds up on a
    // 120Hz display and stutters when a frame is dropped.
    const step = 1 / 60;

    for (const p of this.particles) {
      p.x += p.vx * step;
      p.y += p.vy * step;

      // Wrap rather than bounce — a bounce reveals the edges of the canvas.
      if (p.x < 0) p.x += this.width;
      else if (p.x > this.width) p.x -= this.width;
      if (p.y < 0) p.y += this.height;
      else if (p.y > this.height) p.y -= this.height;

      if (this.pointer && repel > 0) {
        const dx = p.x - this.pointer.x;
        const dy = p.y - this.pointer.y;
        const distance = Math.hypot(dx, dy);
        if (distance > 0.01 && distance < repel) {
          const push = (1 - distance / repel) * 26;
          p.x += (dx / distance) * push * step * 6;
          p.y += (dy / distance) * push * step * 6;
        }
      }
    }

    if (link > 0) this.drawLinks(link, r, g, b);

    ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
    for (const p of this.particles) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /**
   * Spatial hash: bucket by link distance, then compare only against the cell
   * and its right/below neighbours — each pair is visited exactly once.
   */
  private drawLinks(link: number, r: number, g: number, b: number): void {
    const ctx = this.ctx;
    this.cells.clear();
    this.cols = Math.max(1, Math.ceil(this.width / link));
    const rows = Math.max(1, Math.ceil(this.height / link));

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      const cx = Math.min(this.cols - 1, Math.max(0, Math.floor(p.x / link)));
      const cy = Math.min(rows - 1, Math.max(0, Math.floor(p.y / link)));
      const key = cy * this.cols + cx;
      const bucket = this.cells.get(key);
      if (bucket) bucket.push(i);
      else this.cells.set(key, [i]);
    }

    ctx.lineWidth = 1;
    const linkSq = link * link;

    for (const [key, bucket] of this.cells) {
      const cx = key % this.cols;
      const cy = Math.floor(key / this.cols);

      for (let dy = 0; dy <= 1; dy++) {
        for (let dx = dy === 0 ? 0 : -1; dx <= 1; dx++) {
          const nx = cx + dx;
          const ny = cy + dy;
          if (nx < 0 || nx >= this.cols || ny < 0) continue;
          const other = this.cells.get(ny * this.cols + nx);
          if (!other) continue;
          const sameCell = dx === 0 && dy === 0;

          for (let a = 0; a < bucket.length; a++) {
            const p = this.particles[bucket[a]];
            for (let c = sameCell ? a + 1 : 0; c < other.length; c++) {
              const q = this.particles[other[c]];
              const ddx = p.x - q.x;
              const ddy = p.y - q.y;
              const distSq = ddx * ddx + ddy * ddy;
              if (distSq > linkSq) continue;
              const alpha = (1 - Math.sqrt(distSq) / link) * 0.35;
              ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
              ctx.beginPath();
              ctx.moveTo(p.x, p.y);
              ctx.lineTo(q.x, q.y);
              ctx.stroke();
            }
          }
        }
      }
    }
  }
}
