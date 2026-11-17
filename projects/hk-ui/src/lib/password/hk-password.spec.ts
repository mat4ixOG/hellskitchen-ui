import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { HkPasswordComponent } from './hk-password.component';

@Component({
  imports: [HkPasswordComponent],
  template: `<hk-password [(value)]="password" [generate]="true"
    (scored)="score = $event" (revealedChange)="revealed = $event" />`
})
class HostComponent {
  readonly password = signal('');
  score = -1;
  revealed: boolean | null = null;
}

describe('HkPasswordComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  const field = (): HTMLInputElement => fixture.debugElement.query(By.css('input')).nativeElement;
  const meter = (): HTMLElement => fixture.debugElement.query(By.css('[role="progressbar"]')).nativeElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders a masked field, the meter and the default rules', () => {
    expect(field().type).toBe('password');
    expect(meter().getAttribute('aria-valuemax')).toBe('5');
    expect(fixture.debugElement.queryAll(By.css('.hk-pw-rule')).length).toBe(5);
  });

  it('scores from the rules and emits scored', () => {
    field().value = 'abcdefghijkl';
    field().dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(host.password()).toBe('abcdefghijkl');
    expect(host.score).toBe(2);
    expect(meter().getAttribute('aria-valuetext')).toBe('Weak');
  });

  it('toggles reveal without re-creating the input', () => {
    const before = field();
    fixture.debugElement.query(By.css('.hk-pw-reveal')).nativeElement.click();
    fixture.detectChanges();
    expect(field()).toBe(before);
    expect(field().type).toBe('text');
    expect(host.revealed).toBeTrue();
  });

  it('generates a strong password', () => {
    fixture.debugElement.query(By.css('.hk-pw-generate')).nativeElement.click();
    fixture.detectChanges();
    expect(host.password().length).toBe(16);
  });
});
