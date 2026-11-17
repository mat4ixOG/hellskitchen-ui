import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import {
  HkPopoverComponent,
  HkPopoverPlacement,
  HkPopoverTriggerDirective
} from './hk-popover.component';

@Component({
  imports: [HkPopoverComponent, HkPopoverTriggerDirective],
  template: `
    <div style="padding: 160px">
      <hk-popover [placement]="placement()" [arrow]="arrow()" (openChange)="changes.push($event)">
        <button hkPopoverTrigger>Deploy details</button>
        <div hkPopoverContent>v4.2.0</div>
      </hk-popover>
    </div>
  `
})
class HostComponent {
  readonly placement = signal<HkPopoverPlacement>('top');
  readonly arrow = signal(true);
  changes: boolean[] = [];
}

describe('HkPopoverComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  const trigger = (): HTMLButtonElement => fixture.debugElement.query(By.css('button')).nativeElement;
  const panel = () => fixture.debugElement.query(By.css('[role="dialog"]'));

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('toggles from the trigger and reports it', () => {
    expect(panel()).toBeNull();
    expect(trigger().getAttribute('aria-expanded')).toBe('false');

    trigger().click();
    fixture.detectChanges();
    expect(panel()).toBeTruthy();
    expect(panel().nativeElement.textContent).toContain('v4.2.0');
    expect(trigger().getAttribute('aria-expanded')).toBe('true');
    expect(trigger().getAttribute('aria-controls')).toBe(panel().nativeElement.id);

    trigger().click();
    fixture.detectChanges();
    expect(panel()).toBeNull();
    expect(host.changes).toEqual([true, false]);
  });

  it('derives side and alignment from the placement', () => {
    host.placement.set('right-start');
    trigger().click();
    fixture.detectChanges();
    expect(panel().nativeElement.getAttribute('data-side')).toBe('right');
    expect(panel().nativeElement.getAttribute('data-align')).toBe('start');
  });

  it('draws the arrow only when asked', () => {
    trigger().click();
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.css('.hk-popover-arrow'))).toBeTruthy();
    host.arrow.set(false);
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.css('.hk-popover-arrow'))).toBeNull();
  });

  it('closes on Escape', () => {
    trigger().click();
    fixture.detectChanges();
    trigger().dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();
    expect(panel()).toBeNull();
  });
});
