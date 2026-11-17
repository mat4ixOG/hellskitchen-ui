import { Component, signal, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { HkSignupFormComponent, HkSignupValue } from './hk-signup-form.component';

@Component({
  imports: [HkSignupFormComponent],
  template: `
    <hk-signup-form [providers]="['google', 'github', 'microsoft']" [roles]="roles()"
      [minPasswordScore]="5" [busy]="busy()"
      (submitted)="value = $event" (ssoRequested)="sso = $event" />
  `
})
class HostComponent {
  readonly form = viewChild.required(HkSignupFormComponent);
  readonly roles = signal(['Engineering', 'Design']);
  readonly busy = signal(false);
  value: HkSignupValue | null = null;
  sso = '';
}

describe('HkSignupFormComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  const el = <T extends HTMLElement>(css: string): T => fixture.debugElement.query(By.css(css))?.nativeElement;
  const fill = (name: string, value: string): void => {
    const input = el<HTMLInputElement | HTMLSelectElement>(`[formControlName="${name}"]`);
    input.value = value;
    input.dispatchEvent(new Event(input.tagName === 'SELECT' ? 'change' : 'input'));
  };
  const submit = (): void => {
    el<HTMLButtonElement>('button[type="submit"]').click();
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders one SSO button per provider and emits its id', () => {
    const buttons = fixture.debugElement.queryAll(By.css('.hk-sf-sso-btn'));
    expect(buttons.map((b) => b.nativeElement.textContent.trim())).toEqual(['Google', 'GitHub', 'Microsoft']);
    buttons[1].nativeElement.click();
    expect(host.sso).toBe('github');
  });

  it('surfaces every error on an invalid submit and does not emit', () => {
    submit();
    expect(host.value).toBeNull();
    expect(fixture.debugElement.queryAll(By.css('.hk-sf-error')).length).toBe(6);
    expect(el('[role="alert"]').textContent).toContain('6 fields still need attention');
  });

  it('flags a confirm that does not match', () => {
    fill('password', 'Abcdefgh123!');
    fill('confirm', 'nope');
    submit();
    expect(fixture.debugElement.nativeElement.textContent).toContain('The two passwords do not match.');
  });

  it('emits the value once the form is valid', () => {
    fill('name', 'Dee Dash');
    fill('email', 'dee@team.com');
    fill('password', 'Abcdefgh123!');
    fill('confirm', 'Abcdefgh123!');
    fill('role', 'Design');
    el<HTMLInputElement>('[formControlName="terms"]').click();
    submit();
    expect(host.value).toEqual({
      name: 'Dee Dash',
      email: 'dee@team.com',
      password: 'Abcdefgh123!',
      role: 'Design',
      terms: true,
      updates: true
    });
  });

  it('attaches server errors to named fields', () => {
    host.form().setServerErrors({ email: 'That email is taken.' });
    fixture.detectChanges();
    expect(el('.hk-sf-error').textContent).toContain('That email is taken.');
  });
});
