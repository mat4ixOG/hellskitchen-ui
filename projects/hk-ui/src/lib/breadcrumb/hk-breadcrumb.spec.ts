import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { HkBreadcrumbComponent, HkBreadcrumbItem, HkBreadcrumbVariant } from './hk-breadcrumb.component';

@Component({
  imports: [HkBreadcrumbComponent],
  template: `<hk-breadcrumb [items]="trail" [variant]="variant()" (navigate)="went.push($event)" />`
})
class HostComponent {
  readonly variant = signal<HkBreadcrumbVariant>('slash');
  readonly trail: HkBreadcrumbItem[] = [
    { label: 'Home' },
    { label: 'Workspaces' },
    { label: 'Night Shift' },
    { label: 'Services', href: '#services' },
    { label: 'billing-api' },
    { label: 'Deploys' }
  ];
  went: HkBreadcrumbItem[] = [];
}

describe('HkBreadcrumbComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  const crumbs = (): HTMLElement[] =>
    fixture.debugElement.queryAll(By.css('.hk-crumb')).map((el) => el.nativeElement);
  const more = (): HTMLButtonElement | null =>
    fixture.debugElement.query(By.css('.hk-crumb-more'))?.nativeElement ?? null;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('collapses the middle, keeping the root and the last two', () => {
    expect(crumbs().map((el) => el.textContent?.trim())).toEqual(['Home', 'billing-api', 'Deploys']);
    expect(more()).not.toBeNull();
  });

  it('marks the last crumb as the current page', () => {
    const last = crumbs().at(-1)!;
    expect(last.getAttribute('aria-current')).toBe('page');
  });

  it('expands the trail from the ellipsis', () => {
    more()!.click();
    fixture.detectChanges();
    expect(crumbs().length).toBe(6);
    expect(more()).toBeNull();
  });

  it('emits navigate for a crumb and renders an href as a link', () => {
    crumbs()[0].click();
    expect(host.went.map((item) => item.label)).toEqual(['Home']);
    more()!.click();
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.css('a.hk-crumb')).nativeElement.getAttribute('href')).toBe('#services');
  });

  it('shows the pills overflow as a count', () => {
    host.variant.set('pills');
    fixture.detectChanges();
    expect(more()!.textContent?.trim()).toBe('+3');
  });
});
