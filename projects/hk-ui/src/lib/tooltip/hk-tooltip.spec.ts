import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { HkTooltipDirective } from './hk-tooltip.directive';

@Component({
  imports: [HkTooltipDirective],
  template: `
    <button class="copy" [hkTooltip]="text()" hkTooltipPlacement="bottom" [hkTooltipDelay]="200"
      [hkTooltipDisabled]="disabled()">Icon</button>
    <button class="same" hkTooltip="Save">Save</button>
  `
})
class HostComponent {
  readonly text = signal('Copy install command');
  readonly disabled = signal(false);
}

describe('HkTooltipDirective', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  const button = (cls: string): HTMLButtonElement =>
    fixture.debugElement.query(By.css(`.${cls}`)).nativeElement;
  const bubble = (): HTMLElement | null => document.body.querySelector('[role="tooltip"]');

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('shows on focus and links itself with aria-describedby', () => {
    button('copy').dispatchEvent(new Event('focus'));
    expect(bubble()?.textContent).toBe('Copy install command');
    expect(button('copy').getAttribute('aria-describedby')).toBe(bubble()!.id);

    button('copy').dispatchEvent(new Event('blur'));
    expect(bubble()).toBeNull();
    expect(button('copy').hasAttribute('aria-describedby')).toBeFalse();
  });

  it('waits for the delay on hover', fakeAsync(() => {
    button('copy').dispatchEvent(new Event('mouseenter'));
    tick(100);
    expect(bubble()).toBeNull();
    tick(100);
    expect(bubble()).toBeTruthy();
    button('copy').dispatchEvent(new Event('mouseleave'));
    expect(bubble()).toBeNull();
  }));

  it('dismisses on Escape', () => {
    button('copy').dispatchEvent(new Event('focus'));
    button('copy').dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(bubble()).toBeNull();
  });

  it('stays hidden while disabled or empty', () => {
    host.disabled.set(true);
    fixture.detectChanges();
    button('copy').dispatchEvent(new Event('focus'));
    expect(bubble()).toBeNull();

    host.disabled.set(false);
    host.text.set('');
    fixture.detectChanges();
    button('copy').dispatchEvent(new Event('focus'));
    expect(bubble()).toBeNull();
  });

  it('hides from the tree when it would repeat the host label', () => {
    button('same').dispatchEvent(new Event('focus'));
    expect(bubble()?.getAttribute('aria-hidden')).toBe('true');
    expect(button('same').hasAttribute('aria-describedby')).toBeFalse();
    button('same').dispatchEvent(new Event('blur'));
  });
});
