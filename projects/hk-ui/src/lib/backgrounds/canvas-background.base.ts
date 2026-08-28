import { Directive } from '@angular/core';
import { HkBackgroundBase } from './background-base';

/**
 * Backgrounds drawn with the Canvas 2D context.
 *
 * The right choice when the thing being drawn genuinely *is* geometry —
 * particles, grids, lines. For continuous colour fields a fragment shader is
 * the better tool; see `HkShaderBackground`.
 */
@Directive()
export abstract class HkCanvasBackground extends HkBackgroundBase {
  protected ctx!: CanvasRenderingContext2D;

  protected createContext(canvas: HTMLCanvasElement): boolean {
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return false;
    this.ctx = ctx;
    return true;
  }

  protected override onResize(): void {
    // Draw in CSS pixels; the transform absorbs the device ratio.
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.onCanvasResize();
  }

  /** Subclass hook — `onResize` is taken by the DPR transform. */
  protected onCanvasResize(): void {}

  /** Clears in CSS space, ignoring the DPR transform. */
  protected clear(): void {
    this.ctx.clearRect(0, 0, this.width, this.height);
  }
}
