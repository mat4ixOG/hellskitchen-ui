import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { HkProgressComponent, HkProgressVariant } from './hk-progress.component';

@Component({
  imports: [HkProgressComponent],
  template: `
    <hk-progress [value]="value()" [variant]="variant()" [indeterminate]="indeterminate()"
      label="Reindexing" [showValue]="true" />
  `
})
class HostComponent {
  readonly value = signal(38);
  readonly variant = signal<HkProgressVariant>('linear');
  readonly indeterminate = signal(false);
}

describe('HkProgressComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  const bar = (): HTMLElement => fixture.debugElement.query(By.css('hk-progress')).nativeElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('exposes the value as a labelled progressbar', () => {
    expect(bar().getAttribute('role')).toBe('progressbar');
    expect(bar().getAttribute('aria-valuenow')).toBe('38');
    expect(bar().getAttribute('aria-label')).toBe('Reindexing');
    expect(bar().textContent).toContain('38%');
    const fill = fixture.debugElement.query(By.css('.hk-progress-fill')).nativeElement as HTMLElement;
    expect(fill.style.width).toBe('38%');
  });

  it('clamps out-of-range values', () => {
    host.value.set(140);
    fixture.detectChanges();
    expect(bar().getAttribute('aria-valuenow')).toBe('100');
  });

  it('drops aria-valuenow when indeterminate', () => {
    host.indeterminate.set(true);
    fixture.detectChanges();
    expect(bar().hasAttribute('aria-valuenow')).toBeFalse();
  });

  it('renders a ring for the circular variant', () => {
    host.variant.set('circular');
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.css('.hk-progress-ring-fill'))).toBeTruthy();
    expect(fixture.debugElement.query(By.css('.hk-progress-track'))).toBeNull();
  });
});
