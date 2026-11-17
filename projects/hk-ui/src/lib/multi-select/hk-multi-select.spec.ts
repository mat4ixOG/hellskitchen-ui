import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { HkMultiSelectComponent } from './hk-multi-select.component';

@Component({
  imports: [HkMultiSelectComponent],
  template: `
    <hk-multi-select [(value)]="value" [options]="options" groupBy="group" [maxChips]="2"
      (changed)="changes.push($event)" />
  `
})
class HostComponent {
  readonly options = [
    { value: 'us-east-1', label: 'us-east-1', group: 'Americas' },
    { value: 'eu-west-1', label: 'eu-west-1', group: 'Europe' },
    { value: 'eu-north-1', label: 'eu-north-1', group: 'Europe' },
    { value: 'ap-south-1', label: 'ap-south-1', group: 'Asia Pacific' }
  ];
  value = ['eu-west-1', 'ap-south-1', 'us-east-1'];
  changes: string[][] = [];
}

describe('HkMultiSelectComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  const query = <T = HTMLElement>(css: string): T => fixture.debugElement.query(By.css(css))?.nativeElement;
  const all = (css: string): HTMLElement[] =>
    fixture.debugElement.queryAll(By.css(css)).map((el) => el.nativeElement);
  const openPanel = (): void => {
    query<HTMLButtonElement>('.hk-ms-caret').click();
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('collapses chips past maxChips into "+n more"', () => {
    expect(all('.hk-ms-chip').length).toBe(2);
    expect(query('.hk-ms-more').textContent).toContain('+1 more');
  });

  it('renders grouped options and toggles a value', () => {
    openPanel();
    expect(all('.hk-ms-group').map((el) => el.textContent!.trim())).toEqual(['Americas', 'Europe', 'Asia Pacific']);
    all('[role="option"]')[2].click();
    fixture.detectChanges();
    expect(host.value).toEqual(['eu-west-1', 'ap-south-1', 'us-east-1', 'eu-north-1']);
    expect(host.changes.length).toBe(1);
  });

  it('reports a mixed select-all and acts on the filtered rows only', () => {
    host.value = ['eu-west-1'];
    fixture.detectChanges();
    openPanel();
    expect(query('.hk-ms-all').getAttribute('aria-checked')).toBe('mixed');

    const box = query<HTMLInputElement>('.hk-ms-filter');
    box.value = 'eu';
    box.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    query<HTMLButtonElement>('.hk-ms-all').click();
    fixture.detectChanges();
    expect(host.value).toEqual(['eu-west-1', 'eu-north-1']);
  });

  it('clears everything', () => {
    query<HTMLButtonElement>('[aria-label="Clear all"]').click();
    fixture.detectChanges();
    expect(host.value).toEqual([]);
    expect(query('.hk-ms-placeholder').textContent).toContain('Select…');
  });
});
