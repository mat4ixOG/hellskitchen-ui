import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { HkPaginationComponent } from './hk-pagination.component';

@Component({
  imports: [HkPaginationComponent],
  template: `
    <hk-pagination [(page)]="page" [(pageSize)]="size" [total]="487" [pageSizeOptions]="[10, 25, 50]" />
  `
})
class HostComponent {
  readonly page = signal(6);
  readonly size = signal(10);
}

describe('HkPaginationComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  const labels = (): string[] =>
    fixture.debugElement
      .queryAll(By.css('.hk-page-link, .hk-page-gap'))
      .map((el) => (el.nativeElement as HTMLElement).textContent!.trim());
  const query = (selector: string): HTMLElement => fixture.debugElement.query(By.css(selector)).nativeElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('windows the page links with ellipses', () => {
    expect(labels()).toEqual(['1', '…', '5', '6', '7', '…', '49']);
    expect(query('.hk-page-range').textContent?.trim()).toBe('51–60 of 487');
    expect(query('.hk-page-link.is-current').getAttribute('aria-current')).toBe('page');
  });

  it('navigates and two-way binds the page', () => {
    (fixture.debugElement.queryAll(By.css('.hk-page-step'))[1].nativeElement as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(host.page()).toBe(7);
  });

  it('disables previous on the first page rather than hiding it', () => {
    host.page.set(1);
    fixture.detectChanges();
    expect((fixture.debugElement.queryAll(By.css('.hk-page-step'))[0].nativeElement as HTMLButtonElement).disabled).toBeTrue();
  });

  it('changes page size from its own panel and keeps the first record in view', () => {
    query('.hk-page-size-trigger').click();
    fixture.detectChanges();
    const options = fixture.debugElement.queryAll(By.css('.hk-page-option'));
    expect(options.length).toBe(3);
    (options[1].nativeElement as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(host.size()).toBe(25);
    // Record 51 lives on page 3 at 25 per page.
    expect(host.page()).toBe(3);
  });
});
