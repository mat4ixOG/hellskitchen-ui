import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { HkSwitchComponent } from './hk-switch.component';

@Component({
  imports: [HkSwitchComponent],
  template: `<hk-switch [(checked)]="on" [size]="size()" [disabled]="disabled()"
    label="Email me on deploy" (changed)="events.push($event)" />`
})
class HostComponent {
  readonly on = signal(false);
  readonly size = signal<'sm' | 'md' | 'lg'>('md');
  readonly disabled = signal(false);
  events: boolean[] = [];
}

describe('HkSwitchComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  const track = (): HTMLButtonElement =>
    fixture.debugElement.query(By.css('button[role="switch"]')).nativeElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders a labelled switch reflecting the model', () => {
    expect(track().getAttribute('aria-checked')).toBe('false');
    expect(track().getAttribute('aria-label')).toBe('Email me on deploy');
  });

  it('toggles two-way and emits changed', () => {
    track().click();
    fixture.detectChanges();
    expect(host.on()).toBeTrue();
    expect(host.events).toEqual([true]);
    expect(track().getAttribute('aria-checked')).toBe('true');
  });

  it('reflects size on the host and blocks toggling when disabled', () => {
    host.size.set('lg');
    host.disabled.set(true);
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.css('hk-switch')).nativeElement.getAttribute('data-size')).toBe('lg');
    track().click();
    expect(host.on()).toBeFalse();
  });
});
