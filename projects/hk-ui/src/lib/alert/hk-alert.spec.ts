import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { HkAlertComponent, HkAlertTone } from './hk-alert.component';

@Component({
  imports: [HkAlertComponent],
  template: `
    <hk-alert [tone]="tone()" title="Quota at 84%" [dismissible]="true" (dismissed)="dismissals = dismissals + 1">
      Consider raising the concurrency limit.
    </hk-alert>
  `
})
class HostComponent {
  readonly tone = signal<HkAlertTone>('warning');
  dismissals = 0;
}

describe('HkAlertComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  const alert = (): HTMLElement => fixture.debugElement.query(By.css('hk-alert')).nativeElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders the title and projected body', () => {
    expect(alert().textContent).toContain('Quota at 84%');
    expect(alert().textContent).toContain('Consider raising');
    expect(alert().getAttribute('data-tone')).toBe('warning');
  });

  it('interrupts for warning and danger, stays polite for info and success', () => {
    expect(alert().getAttribute('role')).toBe('alert');
    host.tone.set('info');
    fixture.detectChanges();
    expect(alert().getAttribute('role')).toBe('status');
  });

  it('removes itself and emits when dismissed', () => {
    fixture.debugElement.query(By.css('.hk-alert-close')).nativeElement.click();
    fixture.detectChanges();
    expect(host.dismissals).toBe(1);
    expect(alert().textContent?.trim()).toBe('');
    expect(alert().hasAttribute('role')).toBeFalse();
  });
});
