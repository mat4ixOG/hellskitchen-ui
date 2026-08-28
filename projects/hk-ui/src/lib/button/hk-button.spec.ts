import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { HkButtonComponent } from './hk-button.component';

@Component({
  imports: [HkButtonComponent],
  template: `
    <button hkButton [variant]="variant()" [tone]="tone()" [loading]="loading()"
      [disabled]="disabled()" (pressed)="clicks = clicks + 1">Save</button>

    <a hkButton href="#target" [disabled]="linkDisabled()" (pressed)="linkClicks = linkClicks + 1">Go</a>
  `
})
class HostComponent {
  readonly variant = signal<'solid' | 'glass'>('solid');
  readonly tone = signal<'brand' | 'danger'>('brand');
  readonly loading = signal(false);
  readonly disabled = signal(false);
  readonly linkDisabled = signal(false);
  clicks = 0;
  linkClicks = 0;
}

describe('HkButtonComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  const button = (): HTMLButtonElement =>
    fixture.debugElement.query(By.css('button[hkButton]')).nativeElement;
  const link = (): HTMLAnchorElement =>
    fixture.debugElement.query(By.css('a[hkButton]')).nativeElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('emits when pressed', () => {
    button().click();
    expect(host.clicks).toBe(1);
  });

  it('reflects variant and tone as attributes for the token lookup', () => {
    host.variant.set('glass');
    host.tone.set('danger');
    fixture.detectChanges();
    expect(button().getAttribute('data-variant')).toBe('glass');
    expect(button().getAttribute('data-tone')).toBe('danger');
  });

  describe('loading', () => {
    beforeEach(() => {
      host.loading.set(true);
      fixture.detectChanges();
    });

    it('announces itself as busy and blocks the press', () => {
      expect(button().getAttribute('aria-busy')).toBe('true');
      button().click();
      expect(host.clicks).toBe(0);
    });

    it('keeps the label in the DOM so the button does not change width', () => {
      // Removing the label mid-request reflows whatever sits beside it.
      const label = fixture.debugElement.query(By.css('.hk-btn-label')).nativeElement;
      expect(label.textContent.trim()).toBe('Save');
      expect(fixture.debugElement.query(By.css('.hk-btn-spinner'))).toBeTruthy();
    });

    it('still names its loading state for assistive tech', () => {
      expect(
        fixture.debugElement.query(By.css('.hk-sr')).nativeElement.textContent.trim()
      ).toBe('Loading');
    });
  });

  describe('disabled', () => {
    it('sets the native attribute on a button', () => {
      host.disabled.set(true);
      fixture.detectChanges();
      expect(button().hasAttribute('disabled')).toBeTrue();
    });

    it('uses aria-disabled on an anchor, which cannot be natively disabled', () => {
      host.linkDisabled.set(true);
      fixture.detectChanges();
      expect(link().hasAttribute('disabled')).toBeFalse();
      expect(link().getAttribute('aria-disabled')).toBe('true');
    });

    it('stops a disabled anchor from navigating or emitting', () => {
      host.linkDisabled.set(true);
      fixture.detectChanges();
      const event = new MouseEvent('click', { bubbles: true, cancelable: true });
      link().dispatchEvent(event);
      expect(host.linkClicks).toBe(0);
      // An anchor with aria-disabled still follows its href unless stopped.
      expect(event.defaultPrevented).toBeTrue();
    });
  });

  it('defaults the pointer highlight on for glass and off elsewhere', () => {
    expect(button().classList.contains('has-shine')).toBeFalse();
    host.variant.set('glass');
    fixture.detectChanges();
    expect(button().classList.contains('has-shine')).toBeTrue();
    expect(fixture.debugElement.query(By.css('.hk-btn-shine'))).toBeTruthy();
  });

  it('carries a type on a button and none on an anchor', () => {
    expect(button().getAttribute('type')).toBe('button');
    expect(link().hasAttribute('type')).toBeFalse();
  });
});
