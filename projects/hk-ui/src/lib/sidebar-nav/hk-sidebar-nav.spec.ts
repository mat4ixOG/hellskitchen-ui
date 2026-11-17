import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { HkSidebarNavComponent, HkSidebarNavSection } from './hk-sidebar-nav.component';

@Component({
  imports: [HkSidebarNavComponent],
  template: `<hk-sidebar-nav [sections]="sections" [(collapsed)]="collapsed" [(active)]="active" />`
})
class HostComponent {
  readonly collapsed = signal(false);
  readonly active = signal('services');
  readonly sections: HkSidebarNavSection[] = [
    { id: 'overview', label: 'Overview', icon: 'M3 12h18' },
    {
      id: 'services',
      label: 'Services',
      children: [
        { id: 'billing', label: 'billing-api' },
        { id: 'auth', label: 'auth-gateway' }
      ]
    }
  ];
}

describe('HkSidebarNavComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  const rows = (): HTMLButtonElement[] =>
    fixture.debugElement.queryAll(By.css('.hk-side-row')).map((el) => el.nativeElement);
  const children = (): HTMLButtonElement[] =>
    fixture.debugElement.queryAll(By.css('.hk-side-child')).map((el) => el.nativeElement);

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders a labelled nav landmark and opens the active branch', () => {
    expect(fixture.debugElement.query(By.css('nav')).nativeElement.getAttribute('aria-label')).toBeTruthy();
    expect(rows()[1].getAttribute('aria-current')).toBe('page');
    expect(children().length).toBe(2);
  });

  it('selects a section and two-way binds active', () => {
    rows()[0].click();
    fixture.detectChanges();
    expect(host.active()).toBe('overview');
    expect(children().length).toBe(0);
  });

  it('marks a child active and keeps its section highlighted', () => {
    children()[1].click();
    fixture.detectChanges();
    expect(host.active()).toBe('auth');
    expect(children()[1].getAttribute('aria-current')).toBe('page');
    expect(rows()[1].classList.contains('is-active')).toBeTrue();
  });

  it('keeps an accessible name on each row when collapsed', () => {
    host.collapsed.set(true);
    fixture.detectChanges();
    expect(rows()[0].getAttribute('aria-label')).toBe('Overview');
    expect(fixture.debugElement.query(By.css('.hk-side-label'))).toBeNull();
  });
});
