import { Component, signal, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { HkStepComponent, HkStepperComponent, HkStepperVariant } from './hk-stepper.component';

@Component({
  imports: [HkStepperComponent, HkStepComponent],
  template: `
    <hk-stepper [variant]="variant()" [(step)]="step" [linear]="linear()" (completed)="done = done + 1">
      <hk-step label="Install" detail="Add the package." />
      <hk-step label="Configure" detail="Point the tokens." [valid]="valid()" />
      <hk-step label="Ship" />
    </hk-stepper>
  `
})
class HostComponent {
  readonly variant = signal<HkStepperVariant>('rail');
  readonly step = signal(0);
  readonly linear = signal(false);
  readonly valid = signal(true);
  readonly stepper = viewChild.required(HkStepperComponent);
  done = 0;
}

describe('HkStepperComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  const markers = (): HTMLButtonElement[] =>
    fixture.debugElement.queryAll(By.css('.hk-step-rail-item')).map((el) => el.nativeElement);

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders one marker per step and marks the current one', () => {
    expect(markers().length).toBe(3);
    expect(markers()[0].getAttribute('aria-current')).toBe('step');
  });

  it('moves on click and two-way binds the step', () => {
    markers()[2].click();
    fixture.detectChanges();
    expect(host.step()).toBe(2);
  });

  it('blocks skipping past an invalid step in linear mode', () => {
    host.linear.set(true);
    host.valid.set(false);
    fixture.detectChanges();
    markers()[2].click();
    fixture.detectChanges();
    expect(host.step()).toBe(0);
  });

  it('emits completed when next() runs on the last step', () => {
    host.step.set(2);
    fixture.detectChanges();
    host.stepper().next();
    expect(host.done).toBe(1);
  });

  it('shows the active step detail in the panels variant', () => {
    host.variant.set('panels');
    host.step.set(1);
    fixture.detectChanges();
    const detail = fixture.debugElement.query(By.css('.hk-step-detail')).nativeElement as HTMLElement;
    expect(detail.textContent?.trim()).toBe('Point the tokens.');
  });
});
