import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import {
  HkInputAddonDirective,
  HkInputComponent,
  HkInputGroupComponent
} from './hk-input.component';

@Component({
  imports: [HkInputComponent, HkInputGroupComponent, HkInputAddonDirective],
  template: `
    <hk-input id="slug" [(value)]="slug" label="Workspace URL" prefix="hk.dev/"
      hint="Lowercase only." [error]="error()" [clearable]="true" (cleared)="clears = clears + 1" />

    <hk-input-group>
      <hk-input id="email" [(value)]="email" type="email" label="Email" />
      <button type="button" hkInputAddon>Send</button>
    </hk-input-group>
  `
})
class HostComponent {
  readonly slug = signal('night-shift');
  readonly email = signal('');
  readonly error = signal('');
  clears = 0;
}

describe('HkInputComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  const field = (id: string): HTMLInputElement =>
    fixture.debugElement.query(By.css(`#${id} input`)).nativeElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders the label, prefix and hint', () => {
    const label: HTMLLabelElement = fixture.debugElement.query(By.css('#slug label')).nativeElement;
    expect(label.textContent?.trim()).toBe('Workspace URL');
    expect(label.htmlFor).toBe(field('slug').id);
    expect(fixture.nativeElement.querySelector('#slug .is-prefix').textContent).toContain('hk.dev/');
    expect(field('slug').value).toBe('night-shift');
  });

  it('two-way binds the value', () => {
    const input = field('slug');
    input.value = 'red-team';
    input.dispatchEvent(new Event('input'));
    expect(host.slug()).toBe('red-team');
  });

  it('clears and emits cleared', () => {
    fixture.debugElement.query(By.css('#slug .hk-input-clear')).nativeElement.click();
    fixture.detectChanges();
    expect(host.slug()).toBe('');
    expect(host.clears).toBe(1);
    expect(fixture.debugElement.query(By.css('#slug .hk-input-clear'))).toBeNull();
  });

  it('switches to the error state', () => {
    host.error.set('Bad slug');
    fixture.detectChanges();
    expect(field('slug').getAttribute('aria-invalid')).toBe('true');
    expect(fixture.nativeElement.querySelector('#slug .is-error.hk-input-message').textContent).toContain('Bad slug');
  });

  it('renders bare inside a group, labelled by aria-label', () => {
    const grouped = fixture.debugElement.query(By.css('#email')).nativeElement as HTMLElement;
    expect(grouped.classList.contains('is-grouped')).toBeTrue();
    expect(grouped.querySelector('label')).toBeNull();
    expect(field('email').getAttribute('aria-label')).toBe('Email');
    expect(fixture.nativeElement.querySelector('hk-input-group > button').classList).toContain('hk-input-group-addon');
  });
});
