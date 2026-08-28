import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { HkSpotlightComponent } from './hk-spotlight.component';

@Component({
  imports: [HkSpotlightComponent],
  template: `
    <div class="stage" style="position: relative; width: 400px; height: 300px;">
      <hk-spotlight class="absolute inset-0" color="#dc2626" [grid]="true" />
    </div>
  `,
  styles: [`.absolute { position: absolute; } .inset-0 { inset: 0; }`]
})
class DiagHost {}

describe('HkSpotlightComponent', () => {
  it('paints a gradient rather than dropping it as invalid CSS', async () => {
    await TestBed.configureTestingModule({ imports: [DiagHost] }).compileComponents();
    const fixture = TestBed.createComponent(DiagHost);
    fixture.detectChanges();
    await new Promise((r) => setTimeout(r, 20));

    const hostEl = fixture.debugElement.query(By.directive(HkSpotlightComponent))
      .nativeElement as HTMLElement;
    const layer = hostEl.querySelector('.hk-spot-layer') as HTMLElement;
    const grid = hostEl.querySelector('.hk-spot-grid') as HTMLElement;

    const layerCs = layer ? getComputedStyle(layer) : null;

    expect(layer).toBeTruthy();
    // Regression: the gradient used to be dropped as invalid CSS, leaving the
    // spotlight rendering nothing at all.
    expect(layerCs!.backgroundImage).toContain('radial-gradient');
    expect(layerCs!.backgroundImage).not.toBe('none');
  });

  it('follows the pointer', async () => {
    await TestBed.configureTestingModule({ imports: [DiagHost] }).compileComponents();
    const fixture = TestBed.createComponent(DiagHost);
    fixture.detectChanges();
    await new Promise((r) => setTimeout(r, 20));

    const hostEl = fixture.debugElement.query(By.directive(HkSpotlightComponent))
      .nativeElement as HTMLElement;

    hostEl.dispatchEvent(
      new PointerEvent('pointermove', { clientX: 120, clientY: 90, bubbles: true })
    );
    // The write is coalesced to one per animation frame, so wait for one.
    await new Promise((r) => requestAnimationFrame(() => r(null)));

    const x = hostEl.style.getPropertyValue('--hk-spot-x');
    const y = hostEl.style.getPropertyValue('--hk-spot-y');
    expect(x).not.toBe('');
    expect(y).not.toBe('');
  });

  it('re-applies colour when the input changes', async () => {
    @Component({
      imports: [HkSpotlightComponent],
      template: `<hk-spotlight [color]="c" />`
    })
    class ColourHost {
      c = '#dc2626';
    }

    await TestBed.configureTestingModule({ imports: [ColourHost] }).compileComponents();
    const fixture = TestBed.createComponent(ColourHost);
    fixture.detectChanges();
    const el = fixture.debugElement.query(By.directive(HkSpotlightComponent))
      .nativeElement as HTMLElement;
    expect(el.style.getPropertyValue('--hk-spot-color').trim()).toBe('220 38 38');

    // Regression: statics were written once, so the colour picker was inert.
    fixture.componentInstance.c = '#3b82f6';
    fixture.detectChanges();
    expect(el.style.getPropertyValue('--hk-spot-color').trim()).toBe('59 130 246');
  });
});
