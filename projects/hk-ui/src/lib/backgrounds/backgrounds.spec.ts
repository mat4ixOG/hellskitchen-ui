import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import {
  HkAuroraComponent,
  HkBeamsComponent,
  HkDitherComponent,
  HkDotMatrixComponent,
  HkGridMotionComponent,
  HkParticleFieldComponent,
  HkSpotlightComponent,
  HkWavesComponent
} from './index';

@Component({
  imports: [
    HkAuroraComponent,
    HkParticleFieldComponent,
    HkGridMotionComponent,
    HkBeamsComponent,
    HkDotMatrixComponent,
    HkDitherComponent,
    HkWavesComponent,
    HkSpotlightComponent
  ],
  template: `
    <hk-aurora [color]="color()" [speed]="speed()" [paused]="paused()" />
    <hk-particle-field [color]="color()" />
    <hk-grid-motion [color]="color()" />
    <hk-beams [color]="color()" />
    <hk-dot-matrix [color]="color()" />
    <hk-dither [color]="color()" />
    <hk-waves [color]="color()" />
    <hk-spotlight [color]="color()" [grid]="true" />
  `
})
class HostComponent {
  readonly color = signal('#dc2626');
  readonly speed = signal(1);
  readonly paused = signal(false);
}

describe('backgrounds', () => {
  let fixture: ComponentFixture<HostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
  });

  it('gives every canvas background a canvas element', () => {
    // Seven canvas backgrounds; spotlight is deliberately CSS-only.
    const canvases = fixture.debugElement.queryAll(By.css('canvas'));
    expect(canvases.length).toBe(7);
  });

  it('hides every decorative layer from assistive tech', () => {
    const layers = fixture.debugElement.queryAll(
      By.css('canvas, .hk-spot-layer, .hk-spot-grid')
    );
    expect(layers.length).toBeGreaterThan(0);
    for (const layer of layers) {
      expect(layer.nativeElement.getAttribute('aria-hidden')).toBe('true');
    }
  });

  it('renders the spotlight without a canvas', () => {
    const spotlight = fixture.debugElement.query(By.directive(HkSpotlightComponent));
    expect(spotlight.query(By.css('canvas'))).toBeNull();
    expect(spotlight.query(By.css('.hk-spot-layer'))).toBeTruthy();
    expect(spotlight.query(By.css('.hk-spot-grid'))).toBeTruthy();
  });

  it('accepts the shared inputs on every background', () => {
    // Inputs live on the abstract base; without @Directive() on it these would
    // silently not bind, which is exactly the bug this guards.
    const aurora = fixture.debugElement.query(By.directive(HkAuroraComponent))
      .componentInstance as HkAuroraComponent;
    expect(aurora.color()).toBe('#dc2626');
    expect(aurora.speed()).toBe(1);
    expect(aurora.opacity()).toBe(1);
    expect(aurora.paused()).toBeFalse();
  });

  it('reflects a changed colour input', () => {
    fixture.componentInstance.color.set('#3b82f6');
    fixture.detectChanges();
    const beams = fixture.debugElement.query(By.directive(HkBeamsComponent))
      .componentInstance as HkBeamsComponent;
    expect(beams.color()).toBe('#3b82f6');
  });

  it('renders aurora whether or not WebGL is available', async () => {
    // WebGL is missing on plenty of real machines — old GPUs, VMs, browsers
    // with it disabled. A background that renders nothing there is worse than
    // one that renders something simpler, so the fallback is the contract.
    const original = HTMLCanvasElement.prototype.getContext;
    const asked: string[] = [];
    spyOn(HTMLCanvasElement.prototype, 'getContext').and.callFake(function (
      this: HTMLCanvasElement,
      type: string,
      ...rest: unknown[]
    ) {
      asked.push(type);
      // Force the no-WebGL path.
      if (type === 'webgl2' || type === 'webgl') return null;
      return (original as Function).call(this, type, ...rest);
    } as typeof HTMLCanvasElement.prototype.getContext);

    const local = TestBed.createComponent(HostComponent);
    local.detectChanges();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(asked).toContain('webgl2');
    // Having been refused WebGL, it must have fallen back to 2D rather than
    // giving up and leaving an empty canvas.
    expect(asked).toContain('2d');
    expect(local.debugElement.query(By.directive(HkAuroraComponent))).toBeTruthy();
    local.destroy();
  });

  it('falls back to 2D when WebGL2 exists but the shader will not build', async () => {
    // The nastier half of the no-WebGL story: a driver that advertises WebGL2
    // and then refuses the shader. A canvas that has vended a WebGL context can
    // never return a 2D one, so the shader has to be proven on a scratch canvas
    // before the real one is committed — otherwise this renders nothing at all.
    const realCompileShader = WebGL2RenderingContext.prototype.compileShader;
    if (!realCompileShader) {
      pending('no WebGL2 in this browser');
      return;
    }
    // Fail every fragment compile, leaving the vertex path alone.
    spyOn(WebGL2RenderingContext.prototype, 'getShaderParameter').and.returnValue(false);

    const contexts: string[] = [];
    const realGetContext = HTMLCanvasElement.prototype.getContext;
    spyOn(HTMLCanvasElement.prototype, 'getContext').and.callFake(function (
      this: HTMLCanvasElement,
      type: string,
      ...rest: unknown[]
    ) {
      contexts.push(type);
      return (realGetContext as Function).call(this, type, ...rest);
    } as typeof HTMLCanvasElement.prototype.getContext);

    const local = TestBed.createComponent(HostComponent);
    local.detectChanges();
    await new Promise((resolve) => setTimeout(resolve, 0));

    const aurora = local.debugElement.query(By.directive(HkAuroraComponent));
    const canvas = aurora.query(By.css('canvas')).nativeElement as HTMLCanvasElement;
    // The real canvas must have been asked for 2D — which is only possible
    // because it was never handed a WebGL context.
    expect(contexts).toContain('2d');
    expect(canvas.getContext('2d')).toBeTruthy();

    local.destroy();
  });

  it('acts on `paused` while the loop is live, not just at startup', () => {
    // `paused` is documented as pausing without unmounting, so it has to act on
    // a loop that is already running. Reading it once inside start() meant
    // flipping it on a live background did nothing at all.
    //
    // This asserts on the loop's entry points rather than on `running()`,
    // deliberately: `start()` also declines when the tab is hidden or the host
    // is scrolled out of view, so a `running()` assertion passes or fails on
    // whether the browser window happens to be visible — which is how this test
    // first went red in a headed browser while passing headless.
    const local = TestBed.createComponent(HostComponent);
    local.detectChanges();

    const aurora = local.debugElement.query(By.directive(HkAuroraComponent))
      .componentInstance as HkAuroraComponent;
    const loop = aurora as unknown as { start(): void; stop(): void };
    const stop = spyOn(loop, 'stop').and.callThrough();
    const start = spyOn(loop, 'start').and.callThrough();

    local.componentInstance.paused.set(true);
    local.detectChanges();
    expect(stop).toHaveBeenCalled();

    stop.calls.reset();
    start.calls.reset();
    local.componentInstance.paused.set(false);
    local.detectChanges();
    expect(start).toHaveBeenCalled();

    // Speed 0 is the same idea by another route: nothing to animate, so the
    // loop should not be burning frames.
    start.calls.reset();
    local.componentInstance.speed.set(0);
    local.detectChanges();
    expect(stop).toHaveBeenCalled();

    local.destroy();
  });

  it('tears down cleanly, leaving no live animation frames', () => {
    // A background that kept its rAF alive after destroy would leak a loop per
    // navigation — the failure mode that makes these unusable in an SPA.
    const pending = new Set<number>();
    const realRaf = window.requestAnimationFrame;
    const realCancel = window.cancelAnimationFrame;
    spyOn(window, 'requestAnimationFrame').and.callFake((cb) => {
      const id = realRaf(cb);
      pending.add(id);
      return id;
    });
    spyOn(window, 'cancelAnimationFrame').and.callFake((id: number) => {
      pending.delete(id);
      realCancel(id);
    });

    const local = TestBed.createComponent(HostComponent);
    local.detectChanges();
    local.destroy();

    expect(pending.size).toBe(0);
  });
});
