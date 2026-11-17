import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { HkMenuComponent, HkMenuItem, HkMenuTriggerDirective, HkMenuTriggerStyle } from './hk-menu.component';

@Component({
  imports: [HkMenuComponent, HkMenuTriggerDirective],
  template: `
    <hk-menu class="built-in" [items]="items" [trigger]="trigger()" triggerLabel="Actions" (select)="chosen.push($event.label)" />
    <hk-menu class="custom" [items]="items"><button hkMenuTrigger>Mine</button></hk-menu>
  `
})
class HostComponent {
  readonly trigger = signal<HkMenuTriggerStyle>('icon');
  readonly items: HkMenuItem[] = [
    { label: 'Rename', hint: '⌘R' },
    { label: 'Move to', children: [{ label: 'Platform' }, { label: 'Archive' }] },
    { label: 'Delete', danger: true }
  ];
  chosen: string[] = [];
}

describe('HkMenuComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  const trigger = (): HTMLButtonElement => fixture.debugElement.query(By.css('.built-in .hk-menu-trigger')).nativeElement;
  const items = (): HTMLButtonElement[] =>
    fixture.debugElement.queryAll(By.css('.built-in [role="menuitem"]')).map((el) => el.nativeElement);

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('gives the icon trigger an accessible name', () => {
    expect(trigger().getAttribute('aria-label')).toBe('Actions');
    expect(trigger().querySelector('.hk-menu-burger')).toBeTruthy();
  });

  it('shows the label for the label trigger', () => {
    host.trigger.set('label');
    fixture.detectChanges();
    expect(trigger().textContent).toContain('Actions');
    expect(trigger().querySelector('.hk-menu-burger')).toBeNull();
  });

  it('opens, emits the chosen leaf and closes', () => {
    trigger().click();
    fixture.detectChanges();
    expect(trigger().getAttribute('aria-expanded')).toBe('true');
    items()[0].click();
    fixture.detectChanges();
    expect(host.chosen).toEqual(['Rename']);
    expect(fixture.debugElement.query(By.css('.built-in .hk-menu-panel'))).toBeNull();
  });

  it('opens a submenu instead of choosing a parent', () => {
    trigger().click();
    fixture.detectChanges();
    items()[1].click();
    fixture.detectChanges();
    expect(host.chosen).toEqual([]);
    expect(fixture.debugElement.query(By.css('.built-in .hk-menu-sub'))).toBeTruthy();
  });

  it('closes on Escape', () => {
    trigger().click();
    fixture.detectChanges();
    items()[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.css('.built-in .hk-menu-panel'))).toBeNull();
  });

  it('accepts a projected trigger', () => {
    expect(fixture.debugElement.query(By.css('.custom .hk-menu-trigger'))).toBeNull();
    const own = fixture.debugElement.query(By.css('[hkMenuTrigger]')).nativeElement as HTMLButtonElement;
    own.click();
    fixture.detectChanges();
    expect(own.getAttribute('aria-expanded')).toBe('true');
    expect(fixture.debugElement.query(By.css('.custom .hk-menu-panel'))).toBeTruthy();
  });
});
