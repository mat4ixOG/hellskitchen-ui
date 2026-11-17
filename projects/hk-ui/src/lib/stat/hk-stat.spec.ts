import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HkStatComponent } from './hk-stat.component';

@Component({
  imports: [HkStatComponent],
  template: `
    <hk-stat label="Monthly spend" [value]="8420" prefix="$" [delta]="delta()" [countUp]="false">
      <svg hkStatSpark class="spark"></svg>
    </hk-stat>
    <hk-stat id="animated" label="Error rate" [value]="0.04" suffix="%" [decimals]="2" />
  `
})
class HostComponent {
  readonly delta = signal<number | null>(3);
}

describe('HkStatComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  const el = (selector: string): HTMLElement | null => fixture.nativeElement.querySelector(selector);

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders label, formatted value and projected sparkline', () => {
    expect(el('.hk-stat-label')?.textContent).toBe('Monthly spend');
    expect(el('.hk-stat-value')?.textContent).toContain('$8,420');
    expect(el('.hk-stat-spark svg.spark')).toBeTruthy();
  });

  it('keeps the final value available to assistive tech while animating', () => {
    expect(el('#animated .hk-sr')?.textContent).toBe('0.04%');
  });

  it('tones the delta by its sign', () => {
    expect(el('.hk-stat-delta')?.getAttribute('data-dir')).toBe('up');
    expect(el('.hk-stat-delta')?.textContent).toContain('▲ 3%');
    host.delta.set(-8);
    fixture.detectChanges();
    expect(el('.hk-stat-delta')?.getAttribute('data-dir')).toBe('down');
    expect(el('.hk-stat-delta')?.textContent).toContain('▼ 8%');
    host.delta.set(null);
    fixture.detectChanges();
    expect(el('.hk-stat-delta')).toBeNull();
  });
});
