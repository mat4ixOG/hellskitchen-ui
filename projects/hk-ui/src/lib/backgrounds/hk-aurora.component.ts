import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { HkShaderBackground } from './shader-background.base';

/**
 * A flowing aurora, rendered per-pixel.
 *
 * The look comes from **domain warping**: rather than sampling noise at the
 * pixel position, the position is first displaced by more noise, twice. That
 * is what turns concentric blobs into something that folds and flows — the
 * technique is Inigo Quilez's, and it is the difference between "gradients
 * moving around" and "a material".
 *
 * Three things beyond the warp matter as much:
 *   • fBm sums five octaves, so there is detail at several scales rather than
 *     one smooth ramp;
 *   • hue is mixed from the warp field itself, so colour varies across space
 *     the way thin-film interference does;
 *   • a per-pixel grain of 1/255 is added last, which kills the banding that
 *     large smooth gradients always show on dark backgrounds.
 *
 * Falls back to a Canvas 2D approximation where WebGL is unavailable.
 */
@Component({
  selector: 'hk-aurora',
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
export class HkAuroraComponent extends HkShaderBackground {
  /** Hues blended across the field. Three reads best. */
  readonly palette = input<string[]>(['#dc2626', '#7c3aed', '#0ea5e9']);
  /** Overall brightness. Deliberately under 1 — this sits behind content. */
  readonly intensity = input(0.62);
  /** Field scale. Higher is busier, lower is broader. */
  readonly scale = input(2.4);
  /** How far each octave displaces the next. 0 disables the warp. */
  readonly warp = input(3.2);
  /** Darkening toward the edges, 0–1. Higher keeps the corners out of the way. */
  readonly vignette = input(0.75);

  protected fragmentSource(): string {
    return `#version 300 es
precision highp float;

uniform vec2 uResolution;
uniform float uTime;
uniform vec3 uColorA;
uniform vec3 uColorB;
uniform vec3 uColorC;
uniform float uIntensity;
uniform float uScale;
uniform float uWarp;
uniform float uVignette;

out vec4 outColor;

// Cheap deterministic hash. Good enough for value noise and grain, and far
// cheaper than a texture lookup.
float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

// Value noise with a smoothstep fade — the quintic curve keeps the second
// derivative continuous, so octaves do not show grid creases.
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

// Five octaves: each half the amplitude, just over double the frequency. The
// 2.02 rather than 2.0 avoids the octaves aligning into visible lattices.
float fbm(vec2 p) {
  float total = 0.0;
  float amplitude = 0.5;
  for (int i = 0; i < 5; i++) {
    total += amplitude * noise(p);
    p *= 2.02;
    amplitude *= 0.5;
  }
  return total;
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution.xy;
  // Correct for aspect so the field is not stretched on wide canvases.
  vec2 p = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);
  p *= uScale;

  float t = uTime * 0.08;

  // First warp: displace the sample position by a noise field.
  vec2 q = vec2(fbm(p + vec2(0.0, t)), fbm(p + vec2(5.2, 1.3) - t * 0.6));

  // Second warp: displace again using the first result. This is the step that
  // makes the field fold back on itself instead of merely drifting.
  vec2 r = vec2(
    fbm(p + uWarp * q + vec2(1.7, 9.2) + t * 1.4),
    fbm(p + uWarp * q + vec2(8.3, 2.8) + t * 1.1)
  );

  float f = fbm(p + uWarp * r);

  // Colour is mixed from the warp fields, so hue varies across space rather
  // than being a single ramp between two stops.
  vec3 col = mix(uColorA, uColorB, clamp(f * f * 2.0, 0.0, 1.0));
  col = mix(col, uColorC, clamp(length(q) * 0.75, 0.0, 1.0));
  col = mix(col, uColorB, clamp(r.x * 0.55, 0.0, 1.0));

  // Lift the brighter folds so the field reads as lit rather than flat. The
  // curve is gentle on purpose: a steep one blows the folds out to flat colour
  // and the whole thing stops reading as depth.
  col *= (0.22 + 0.78 * f) * uIntensity;

  float vig = smoothstep(1.25, 0.25, length(uv - 0.5));
  col *= mix(1.0, vig, uVignette);

  // Alpha follows brightness, so the background composites over whatever is
  // behind it instead of sitting on an opaque black rectangle. Capped well
  // below 1 so text laid over it always stays readable.
  float alpha = clamp(max(col.r, max(col.g, col.b)) * 1.15, 0.0, 0.82);

  // Grain, added last. One 255th of a step is invisible as texture but breaks
  // up the 8-bit banding that smooth gradients always show on dark surfaces.
  float grain = (hash(gl_FragCoord.xy + fract(uTime)) - 0.5) / 255.0;
  outColor = vec4(col + grain, alpha);
}`;
  }

  protected setUniforms(t: number): void {
    const colours = this.palette().length ? this.palette() : [this.color()];
    const pick = (i: number) => this.rgbUnit(colours[i % colours.length]);

    this.setVec2('uResolution', this.canvas.width, this.canvas.height);
    this.setFloat('uTime', t);
    this.setVec3('uColorA', pick(0));
    this.setVec3('uColorB', pick(1));
    this.setVec3('uColorC', pick(2));
    this.setFloat('uIntensity', this.intensity());
    this.setFloat('uScale', this.scale());
    this.setFloat('uWarp', this.warp());
    this.setFloat('uVignette', this.vignette());
  }

  /**
   * Canvas 2D stand-in for machines with no WebGL. Four drifting radial
   * gradients — visibly simpler than the shader, but the same palette and
   * motion, so a page does not lose its background entirely.
   */
  protected fallbackFrame(ctx: CanvasRenderingContext2D, t: number): void {
    const colours = this.palette().length ? this.palette() : [this.color()];
    const radius = Math.min(this.width, this.height) * 0.6;

    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 4; i++) {
      const phase = (i * Math.PI * 2) / 4;
      const x = this.width * (0.5 + 0.32 * Math.sin(t * 0.22 + phase));
      const y = this.height * (0.5 + 0.3 * Math.cos(t * 0.18 + phase * 1.3));
      const { r, g, b } = this.rgb(colours[i % colours.length]);

      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
      gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.3)`);
      gradient.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, 0.1)`);
      gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
  }
}
