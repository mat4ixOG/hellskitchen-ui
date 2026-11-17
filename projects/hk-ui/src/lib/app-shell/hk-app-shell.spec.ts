import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { HkAppShellComponent } from './hk-app-shell.component';

@Component({
  imports: [HkAppShellComponent],
  template: `
    <hk-app-shell [(navOpen)]="navOpen" navWidth="7rem" [overlayBelow]="overlayBelow()">
      <header hkShellHeader>Header</header>
      <nav hkShellNav><button class="nav-link">Overview</button></nav>
      <main hkShellContent>Content</main>
    </hk-app-shell>
  `
})
class HostComponent {
  readonly navOpen = signal(true);
  readonly overlayBelow = signal('0px');
}

describe('HkAppShellComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  const shell = (): HTMLElement => fixture.debugElement.query(By.css('hk-app-shell')).nativeElement;
  const rail = (): HTMLElement => fixture.debugElement.query(By.css('.hk-shell-nav')).nativeElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('projects the three landmarks', () => {
    expect(shell().querySelector('.hk-shell-header header')).toBeTruthy();
    expect(shell().querySelector('.hk-shell-nav nav')).toBeTruthy();
    expect(shell().querySelector('.hk-shell-content main')).toBeTruthy();
  });

  it('writes the rail width and hides the rail when closed', () => {
    expect(shell().style.getPropertyValue('--hk-shell-nav-w')).toBe('7rem');
    expect(rail().hidden).toBeFalse();
    host.navOpen.set(false);
    fixture.detectChanges();
    expect(rail().hidden).toBeTrue();
  });

  it('overlays below the breakpoint and closes on Escape', async () => {
    host.overlayBelow.set('100000px');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(shell().classList.contains('is-overlay')).toBeTrue();
    rail().querySelector('button')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();
    expect(host.navOpen()).toBeFalse();
  });
});
