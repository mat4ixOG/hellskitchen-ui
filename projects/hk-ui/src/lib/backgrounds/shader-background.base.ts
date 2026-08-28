import { Directive } from '@angular/core';
import { HkBackgroundBase } from './background-base';

/**
 * Backgrounds drawn with a WebGL2 fragment shader.
 *
 * The reason this exists: Canvas 2D draws *shapes* — arcs, rects, gradients —
 * and the eye reads them as objects on a plane. A fragment shader evaluates a
 * colour at *every pixel*, and the eye reads a continuous material. Effects
 * like iridescence or a flowing field are not reachable by stacking canvas
 * primitives at any level of effort, which is why they get their own base.
 *
 * WebGL is not universal — old devices, VMs, disabled GPUs, and browsers that
 * have simply lost the context. So `createContext` failing is a normal path,
 * not an error: the subclass falls back to a 2D rendering of the same idea.
 */
@Directive()
export abstract class HkShaderBackground extends HkBackgroundBase {
  protected gl: WebGL2RenderingContext | null = null;
  protected program: WebGLProgram | null = null;
  /** 2D context used when WebGL is unavailable. */
  protected fallbackCtx: CanvasRenderingContext2D | null = null;

  private uniforms = new Map<string, WebGLUniformLocation | null>();

  /** The fragment shader body. Must declare `out vec4 outColor`. */
  protected abstract fragmentSource(): string;
  /** Push this frame's uniforms. Called with the program already bound. */
  protected abstract setUniforms(t: number): void;
  /** Draw the same idea in 2D when WebGL is unavailable. */
  protected abstract fallbackFrame(ctx: CanvasRenderingContext2D, t: number): void;

  /**
   * A fullscreen triangle with no vertex buffer at all: three vertices derived
   * from gl_VertexID. Cheaper than a quad (no diagonal seam, one less vertex)
   * and it means there is no attribute state to set up or tear down.
   */
  private static readonly VERTEX_SOURCE = `#version 300 es
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

  protected createContext(canvas: HTMLCanvasElement): boolean {
    const gl = canvas.getContext('webgl2', {
      alpha: true,
      antialias: false,
      // The background is redrawn every frame; preserving it wastes bandwidth.
      preserveDrawingBuffer: false,
      powerPreference: 'low-power'
    }) as WebGL2RenderingContext | null;

    if (!gl || !this.buildProgram(gl)) {
      return this.useFallback(canvas);
    }

    this.gl = gl;

    // A lost context is recoverable and not rare — a GPU reset, a laptop
    // switching graphics. Stop cleanly rather than spewing GL errors.
    canvas.addEventListener('webglcontextlost', this.onContextLost, false);
    canvas.addEventListener('webglcontextrestored', this.onContextRestored, false);

    this.destroyRef.onDestroy(() => {
      canvas.removeEventListener('webglcontextlost', this.onContextLost);
      canvas.removeEventListener('webglcontextrestored', this.onContextRestored);
      this.releaseGl();
    });
    return true;
  }

  private useFallback(canvas: HTMLCanvasElement): boolean {
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return false;
    this.fallbackCtx = ctx;
    return true;
  }

  private buildProgram(gl: WebGL2RenderingContext): boolean {
    const vertex = this.compile(gl, gl.VERTEX_SHADER, HkShaderBackground.VERTEX_SOURCE);
    const fragment = this.compile(gl, gl.FRAGMENT_SHADER, this.fragmentSource());
    if (!vertex || !fragment) return false;

    const program = gl.createProgram();
    if (!program) return false;
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);

    // Shaders can be detached and deleted the moment the program links.
    gl.detachShader(program, vertex);
    gl.detachShader(program, fragment);
    gl.deleteShader(vertex);
    gl.deleteShader(fragment);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      gl.deleteProgram(program);
      return false;
    }
    this.program = program;
    return true;
  }

  private compile(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader | null {
    const shader = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  private readonly onContextLost = (event: Event): void => {
    event.preventDefault();
    this.stop();
    this.gl = null;
  };

  private readonly onContextRestored = (): void => {
    if (this.createContext(this.canvas)) this.start();
  };

  private releaseGl(): void {
    if (this.gl && this.program) this.gl.deleteProgram(this.program);
    this.program = null;
    this.gl = null;
  }

  protected override onResize(): void {
    if (this.gl) this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    else if (this.fallbackCtx) this.fallbackCtx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  protected frame(t: number): void {
    if (this.fallbackCtx) {
      this.fallbackCtx.clearRect(0, 0, this.width, this.height);
      this.fallbackFrame(this.fallbackCtx, t);
      return;
    }
    const gl = this.gl;
    if (!gl || !this.program) return;

    gl.useProgram(this.program);
    this.setUniforms(t);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  /** Cached uniform lookup — `getUniformLocation` is a synchronous GL call. */
  protected uniform(name: string): WebGLUniformLocation | null {
    if (!this.uniforms.has(name)) {
      this.uniforms.set(
        name,
        this.gl && this.program ? this.gl.getUniformLocation(this.program, name) : null
      );
    }
    return this.uniforms.get(name) ?? null;
  }

  protected setFloat(name: string, value: number): void {
    const location = this.uniform(name);
    if (location) this.gl?.uniform1f(location, value);
  }

  protected setVec2(name: string, x: number, y: number): void {
    const location = this.uniform(name);
    if (location) this.gl?.uniform2f(location, x, y);
  }

  protected setVec3(name: string, value: [number, number, number]): void {
    const location = this.uniform(name);
    if (location) this.gl?.uniform3f(location, value[0], value[1], value[2]);
  }
}
