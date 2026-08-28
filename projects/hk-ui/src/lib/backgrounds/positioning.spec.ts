import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { HkAuroraComponent } from './hk-aurora.component';

/**
 * Angular component styles are unlayered, and unlayered rules beat layered
 * ones whatever their specificity. Tailwind ships `.absolute` inside
 * `@layer utilities`, so a bare `:host { position: relative }` silently won —
 * and every background sat in flow at its intrinsic height instead of filling
 * the box it was told to fill.
 */
@Component({
  imports: [HkAuroraComponent],
  template: `
    <div style="position: relative; width: 300px; height: 240px;">
      <hk-aurora class="bg-abs" />
    </div>
  `,
  // Stands in for Tailwind's layered utility.
  styles: [`@layer utilities { .bg-abs { position: absolute; inset: 0; } }`]
})
class PositionHost {}

describe('background positioning', () => {
  it('lets a layered utility override the host default', async () => {
    await TestBed.configureTestingModule({ imports: [PositionHost] }).compileComponents();
    const fixture = TestBed.createComponent(PositionHost);
    fixture.detectChanges();
    await new Promise((r) => setTimeout(r, 20));

    const el = fixture.debugElement.query(By.directive(HkAuroraComponent))
      .nativeElement as HTMLElement;
    const rect = el.getBoundingClientRect();

    expect(getComputedStyle(el).position).toBe('absolute');
    // The whole point: it must fill the 300x240 parent, not collapse to the
    // canvas's intrinsic 300x150.
    expect(Math.round(rect.width)).toBe(300);
    expect(Math.round(rect.height)).toBe(240);
  });
});
