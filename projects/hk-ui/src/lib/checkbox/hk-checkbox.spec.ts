import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { HkCheckboxComponent } from './hk-checkbox.component';

@Component({
  imports: [HkCheckboxComponent],
  template: `<hk-checkbox [(checked)]="on" [indeterminate]="mixed()" [disabled]="disabled()"
    label="Deploys" (changed)="events.push($event)" />`
})
class HostComponent {
  readonly on = signal(false);
  readonly mixed = signal(false);
  readonly disabled = signal(false);
  events: boolean[] = [];
}

describe('HkCheckboxComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  const box = (): HTMLButtonElement => fixture.debugElement.query(By.css('[role="checkbox"]')).nativeElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders the label and the unchecked state', () => {
    expect(box().textContent).toContain('Deploys');
    expect(box().getAttribute('aria-checked')).toBe('false');
  });

  it('toggles two-way and emits changed', () => {
    box().click();
    fixture.detectChanges();
    expect(host.on()).toBeTrue();
    expect(host.events).toEqual([true]);
    expect(box().getAttribute('aria-checked')).toBe('true');
  });

  it('reports the mixed state', () => {
    host.mixed.set(true);
    fixture.detectChanges();
    expect(box().getAttribute('aria-checked')).toBe('mixed');
    expect(fixture.debugElement.query(By.css('.hk-checkbox-dash'))).toBeTruthy();
  });

  it('does nothing when disabled', () => {
    host.disabled.set(true);
    fixture.detectChanges();
    box().click();
    expect(host.on()).toBeFalse();
  });
});
