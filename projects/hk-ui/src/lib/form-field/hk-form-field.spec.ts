import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { HkControlDirective, HkFormFieldComponent } from './hk-form-field.component';

@Component({
  imports: [HkFormFieldComponent, HkControlDirective],
  template: `
    <hk-form-field label="Work email" hint="Deploy alerts only." [error]="error()" [required]="true">
      <input hkControl type="email" />
    </hk-form-field>
  `
})
class HostComponent {
  readonly error = signal('');
}

describe('HkFormFieldComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  const control = (): HTMLInputElement => fixture.debugElement.query(By.css('input')).nativeElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('links the label to the projected control', () => {
    const label: HTMLLabelElement = fixture.debugElement.query(By.css('label')).nativeElement;
    expect(label.htmlFor).toBe(control().id);
    expect(control().id).toBeTruthy();
    expect(control().hasAttribute('required')).toBeTrue();
  });

  it('describes the control by the hint, then by the error', () => {
    const hint = fixture.debugElement.query(By.css('.hk-field-hint')).nativeElement;
    expect(control().getAttribute('aria-describedby')).toBe(hint.id);
    expect(control().hasAttribute('aria-invalid')).toBeFalse();

    host.error.set('Use your company address.');
    fixture.detectChanges();
    const error = fixture.debugElement.query(By.css('.hk-field-error')).nativeElement;
    expect(error.textContent).toContain('Use your company address.');
    expect(control().getAttribute('aria-describedby')).toBe(error.id);
    expect(control().getAttribute('aria-invalid')).toBe('true');
    expect(fixture.debugElement.query(By.css('.hk-field-hint'))).toBeNull();
  });
});
