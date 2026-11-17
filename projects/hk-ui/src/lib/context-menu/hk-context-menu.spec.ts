import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { HkContextMenuDirective } from './hk-context-menu.directive';
import { HkContextMenuItem } from './hk-context-menu-panel.component';

@Component({
  imports: [HkContextMenuDirective],
  template: `
    <div class="surface" style="width: 300px; height: 200px"
      [hkContextMenu]="items" [disabled]="disabled()" (menuSelect)="chosen = $event"></div>
  `
})
class HostComponent {
  readonly items: HkContextMenuItem[] = [{ label: 'Open' }, { label: 'Delete', danger: true }];
  readonly disabled = signal(false);
  chosen: HkContextMenuItem | null = null;
}

describe('HkContextMenuDirective', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  const surface = (): HTMLElement => fixture.debugElement.query(By.css('.surface')).nativeElement;
  const menu = (): HTMLElement | null => fixture.nativeElement.querySelector('[role="menu"]');

  const rightClick = (): MouseEvent => {
    const rect = surface().getBoundingClientRect();
    const event = new MouseEvent('contextmenu', {
      bubbles: true,
      cancelable: true,
      clientX: rect.left + 10,
      clientY: rect.top + 10
    });
    surface().dispatchEvent(event);
    fixture.detectChanges();
    return event;
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('opens on right-click in place of the browser menu', () => {
    const event = rightClick();
    expect(event.defaultPrevented).toBeTrue();
    const items = menu()!.querySelectorAll('[role="menuitem"]');
    expect(items.length).toBe(2);
    expect(items[1].classList.contains('is-danger')).toBeTrue();
  });

  it('emits the chosen item and closes', () => {
    rightClick();
    (menu()!.querySelectorAll('[role="menuitem"]')[1] as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(host.chosen?.label).toBe('Delete');
    expect(menu()).toBeNull();
  });

  it('closes on Escape and returns focus to the target', () => {
    rightClick();
    menu()!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();
    expect(menu()).toBeNull();
    expect(document.activeElement).toBe(surface());
  });

  it('opens from the keyboard menu key', () => {
    surface().dispatchEvent(new KeyboardEvent('keydown', { key: 'F10', shiftKey: true, bubbles: true }));
    fixture.detectChanges();
    expect(menu()).toBeTruthy();
  });

  it('leaves the browser menu alone when disabled', () => {
    host.disabled.set(true);
    fixture.detectChanges();
    const event = rightClick();
    expect(event.defaultPrevented).toBeFalse();
    expect(menu()).toBeNull();
  });
});
