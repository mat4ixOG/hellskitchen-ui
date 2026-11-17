import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { HkDividerComponent, HkDividerOrientation } from './hk-divider.component';

@Component({
  imports: [HkDividerComponent],
  template: `<hk-divider [orientation]="orientation()" [label]="label()" [decorative]="decorative()" />`
})
class HostComponent {
  readonly orientation = signal<HkDividerOrientation>('horizontal');
  readonly label = signal('');
  readonly decorative = signal(true);
}

describe('HkDividerComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  const divider = (): HTMLElement => fixture.debugElement.query(By.css('hk-divider')).nativeElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('is hidden from assistive tech by default', () => {
    expect(divider().getAttribute('aria-hidden')).toBe('true');
    expect(divider().hasAttribute('role')).toBeFalse();
  });

  it('renders its label between two rules', () => {
    host.label.set('or');
    fixture.detectChanges();
    expect(divider().querySelector('.hk-divider-label')?.textContent).toBe('or');
    expect(divider().querySelectorAll('.hk-divider-line').length).toBe(2);
    expect(divider().hasAttribute('aria-hidden')).toBeFalse();
  });

  it('becomes a separator when not decorative', () => {
    host.decorative.set(false);
    host.orientation.set('vertical');
    fixture.detectChanges();
    expect(divider().getAttribute('role')).toBe('separator');
    expect(divider().getAttribute('aria-orientation')).toBe('vertical');
  });
});
