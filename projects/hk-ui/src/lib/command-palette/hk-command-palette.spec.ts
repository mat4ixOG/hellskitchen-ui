import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { HkCommandPaletteComponent, HkCommandPaletteItem } from './hk-command-palette.component';

@Component({
  imports: [HkCommandPaletteComponent],
  template: `<hk-command-palette [(open)]="open" [commands]="commands" (run)="ran.push($event.label)" />`
})
class HostComponent {
  readonly open = signal(true);
  readonly commands: HkCommandPaletteItem[] = [
    { label: 'Deploy billing-api', group: 'Actions', hint: '⌘⏎' },
    { label: 'Roll back last deploy', group: 'Actions' },
    { label: 'Go to Services', group: 'Navigate' }
  ];
  ran: string[] = [];
}

describe('HkCommandPaletteComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  const options = (): HTMLElement[] =>
    fixture.debugElement.queryAll(By.css('[role="option"]')).map((el) => el.nativeElement);
  const field = (): HTMLInputElement => fixture.debugElement.query(By.css('input')).nativeElement;
  const key = (name: string): void => {
    field().dispatchEvent(new KeyboardEvent('keydown', { key: name, bubbles: true }));
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('groups commands under headings', () => {
    const headings = fixture.debugElement.queryAll(By.css('[role="heading"]'));
    expect(headings.map((el) => el.nativeElement.textContent.trim())).toEqual(['Actions', 'Navigate']);
    expect(options().length).toBe(3);
  });

  it('matches by subsequence', () => {
    field().value = 'dbi';
    field().dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(options().map((el) => el.querySelector('span')?.textContent?.trim())).toEqual(['Deploy billing-api']);
  });

  it('moves with the arrows, wraps, and runs on Enter', () => {
    key('ArrowUp');
    expect(options()[2].getAttribute('aria-selected')).toBe('true');
    expect(field().getAttribute('aria-activedescendant')).toBe(options()[2].id);
    key('ArrowDown');
    key('ArrowDown');
    key('Enter');
    expect(host.ran).toEqual(['Roll back last deploy']);
  });

  it('closes on Escape and renders nothing while closed', () => {
    key('Escape');
    expect(host.open()).toBeFalse();
    expect(fixture.debugElement.query(By.css('.hk-cmd'))).toBeNull();
  });

  it('opens on the hotkey', () => {
    host.open.set(false);
    fixture.detectChanges();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }));
    fixture.detectChanges();
    expect(host.open()).toBeTrue();
  });
});
