import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HkRevealDirective } from './hk-reveal.directive';

@Component({
  imports: [HkRevealDirective],
  template: `<div hkReveal [revealDelay]="180" style="height: 40px">content</div>`
})
class HostComponent {}

describe('HkRevealDirective', () => {
  let fixture: ComponentFixture<HostComponent>;
  const el = (): HTMLElement => fixture.nativeElement.querySelector('[hkReveal]');

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    fixture.autoDetectChanges();
  });

  it('starts hidden with the stagger delay applied', () => {
    expect(el().style.transitionDelay).toBe('180ms');
    expect(el().textContent).toBe('content');
  });

  it('reveals once it intersects the viewport', async () => {
    const deadline = Date.now() + 2000;
    while (!el().classList.contains('is-visible') && Date.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, 20));
      fixture.detectChanges();
    }
    expect(el().classList.contains('is-visible')).toBeTrue();
    expect(el().style.opacity).toBe('1');
  });
});
