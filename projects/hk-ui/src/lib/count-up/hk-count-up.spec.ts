import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HkCountUpDirective } from './hk-count-up.directive';

@Component({
  imports: [HkCountUpDirective],
  template: `<span hkCountUp [countTo]="target()" [countDuration]="0" countPrefix="$">0</span>`
})
class HostComponent {
  readonly target = signal(48000);
}

describe('HkCountUpDirective', () => {
  let fixture: ComponentFixture<HostComponent>;
  const el = (): HTMLElement => fixture.nativeElement.querySelector('span');

  const waitFor = async (text: string): Promise<void> => {
    const deadline = Date.now() + 2000;
    while (el().textContent !== text && Date.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, 20));
      fixture.detectChanges();
    }
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    fixture.autoDetectChanges();
  });

  it('is marked aria-live off', () => {
    expect(el().getAttribute('aria-live')).toBe('off');
  });

  it('counts to the target in view and retriggers when it changes', async () => {
    await waitFor('$48,000');
    expect(el().textContent).toBe('$48,000');

    fixture.componentInstance.target.set(12500);
    fixture.detectChanges();
    await waitFor('$12,500');
    expect(el().textContent).toBe('$12,500');
  });
});
