import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { HkDrawerComponent, HkDrawerSide } from './hk-drawer.component';

@Component({
  imports: [HkDrawerComponent],
  template: `
    <div style="position: relative; height: 200px">
      <hk-drawer [(open)]="open" [side]="side()" size="14rem" label="Filters">
        <p class="content">Filters</p>
      </hk-drawer>
    </div>
  `
})
class HostComponent {
  readonly open = signal(false);
  readonly side = signal<HkDrawerSide>('right');
}

describe('HkDrawerComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  const panel = () => fixture.debugElement.query(By.css('[role="dialog"]'));

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders nothing while closed', () => {
    expect(panel()).toBeNull();
  });

  it('renders a labelled modal panel on the chosen side', () => {
    host.side.set('left');
    host.open.set(true);
    fixture.detectChanges();
    const el = panel().nativeElement as HTMLElement;
    expect(el.getAttribute('aria-label')).toBe('Filters');
    expect(el.getAttribute('aria-modal')).toBe('true');
    expect(el.getAttribute('data-side')).toBe('left');
    expect(el.style.getPropertyValue('--hk-drawer-size')).toBe('14rem');
    expect(el.textContent).toContain('Filters');
  });

  it('closes from the close button and the scrim, updating the binding', () => {
    host.open.set(true);
    fixture.detectChanges();
    fixture.debugElement.query(By.css('.hk-drawer-close')).nativeElement.click();
    fixture.detectChanges();
    expect(host.open()).toBeFalse();

    host.open.set(true);
    fixture.detectChanges();
    fixture.debugElement.query(By.css('.hk-drawer-scrim')).nativeElement.click();
    fixture.detectChanges();
    expect(host.open()).toBeFalse();
  });

  it('closes on Escape', () => {
    host.open.set(true);
    fixture.detectChanges();
    panel().nativeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();
    expect(host.open()).toBeFalse();
  });
});
