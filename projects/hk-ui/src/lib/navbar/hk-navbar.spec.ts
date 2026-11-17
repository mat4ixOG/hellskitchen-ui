import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { HkNavbarComponent, HkNavbarItem, HkNavbarVariant } from './hk-navbar.component';

@Component({
  imports: [HkNavbarComponent],
  template: `
    <hk-navbar [variant]="variant()" [items]="items" [(active)]="active" (selected)="picked.push($event)"
      (menuToggled)="toggles.push($event)">
      <span hkNavbarStart class="brand">Brand</span>
      <button hkNavbarEnd class="cta">Deploy</button>
    </hk-navbar>
  `
})
class HostComponent {
  readonly variant = signal<HkNavbarVariant>('pill');
  readonly active = signal('home');
  readonly items: HkNavbarItem[] = [
    { id: 'home', label: 'Home', icon: 'M3 12h18' },
    { id: 'activity', label: 'Activity', badge: 4 },
    { id: 'team', label: 'Team' }
  ];
  picked: string[] = [];
  toggles: boolean[] = [];
}

describe('HkNavbarComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  const items = (): HTMLButtonElement[] =>
    fixture.debugElement.queryAll(By.css('.hk-nav-item')).map((el) => el.nativeElement);

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders the items, projected slots and the current marker', () => {
    expect(items().length).toBe(3);
    expect(items()[0].getAttribute('aria-current')).toBe('page');
    expect(fixture.debugElement.query(By.css('.brand'))).toBeTruthy();
    expect(fixture.debugElement.query(By.css('.cta'))).toBeTruthy();
    expect(items()[1].querySelector('.hk-nav-badge')?.getAttribute('aria-label')).toBe('4 new');
  });

  it('moves the indicator and emits on select', () => {
    items()[2].click();
    fixture.detectChanges();
    expect(host.active()).toBe('team');
    expect(host.picked).toEqual(['team']);
    const indicator = fixture.debugElement.query(By.css('.hk-nav-indicator')).nativeElement as HTMLElement;
    expect(indicator.style.transform).toBe('translateX(200%)');
  });

  it('toggles the mobile sheet in the bar variant', () => {
    host.variant.set('bar');
    fixture.detectChanges();
    const burger = fixture.debugElement.query(By.css('.hk-nav-burger')).nativeElement as HTMLButtonElement;
    burger.click();
    fixture.detectChanges();
    expect(burger.getAttribute('aria-expanded')).toBe('true');
    expect(host.toggles).toEqual([true]);
  });

  it('renders the dock with labelled tiles', () => {
    host.variant.set('dock');
    fixture.detectChanges();
    const tiles = fixture.debugElement.queryAll(By.css('.hk-nav-dock-item'));
    expect(tiles.length).toBe(3);
    expect(tiles[1].nativeElement.getAttribute('aria-label')).toBe('Activity');
  });
});
