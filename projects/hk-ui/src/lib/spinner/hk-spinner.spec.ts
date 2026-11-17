import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { HkSpinnerComponent, HkSpinnerVariant } from './hk-spinner.component';

@Component({
  imports: [HkSpinnerComponent],
  template: `<hk-spinner [variant]="variant()" [inherit]="inherit()" label="Deploying" [delay]="delay()" />`
})
class HostComponent {
  readonly variant = signal<HkSpinnerVariant>('ring');
  readonly inherit = signal(false);
  readonly delay = signal(0);
}

describe('HkSpinnerComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  const spinner = (): HTMLElement => fixture.debugElement.query(By.css('hk-spinner')).nativeElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('announces politely with its label', () => {
    expect(spinner().getAttribute('role')).toBe('status');
    expect(spinner().getAttribute('aria-live')).toBe('polite');
    expect(spinner().querySelector('.hk-sr')?.textContent).toBe('Deploying');
    expect(spinner().querySelector('.sp-ring')).toBeTruthy();
  });

  it('switches variant', () => {
    host.variant.set('bars');
    fixture.detectChanges();
    expect(spinner().querySelectorAll('.sp-bars > span').length).toBe(4);
  });

  it('borrows currentColor when inheriting', () => {
    host.inherit.set(true);
    fixture.detectChanges();
    expect(spinner().classList).toContain('is-inherit');
  });

  it('waits out the delay before showing', fakeAsync(() => {
    host.delay.set(300);
    fixture.detectChanges();
    expect(spinner().querySelector('.sp-ring')).toBeNull();
    tick(300);
    fixture.detectChanges();
    expect(spinner().querySelector('.sp-ring')).toBeTruthy();
  }));
});
