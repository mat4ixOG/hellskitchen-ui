import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { HkSelectComponent } from './hk-select.component';

@Component({
  imports: [HkSelectComponent],
  template: `
    <hk-select [(value)]="value" [options]="options" [multiple]="multiple()" [filterable]="true"
      placeholder="Choose regions" (opened)="opens = opens + 1" />
  `
})
class HostComponent {
  readonly options = ['us-east-1', 'eu-west-1', 'ap-south-1'];
  readonly multiple = signal(true);
  value: unknown = ['eu-west-1'];
  opens = 0;
}

describe('HkSelectComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  const trigger = (): HTMLButtonElement =>
    fixture.debugElement.query(By.css('.hk-select-trigger')).nativeElement;
  const options = (): HTMLElement[] =>
    fixture.debugElement.queryAll(By.css('[role="option"]')).map((el) => el.nativeElement);

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('shows the selection in the trigger and opens the listbox', () => {
    expect(trigger().textContent).toContain('eu-west-1');
    trigger().click();
    fixture.detectChanges();
    expect(options().length).toBe(3);
    expect(host.opens).toBe(1);
    expect(trigger().getAttribute('aria-expanded')).toBe('true');
  });

  it('toggles values in multiple mode and writes them back', () => {
    trigger().click();
    fixture.detectChanges();
    options()[0].click();
    fixture.detectChanges();
    expect(host.value).toEqual(['eu-west-1', 'us-east-1']);
    options()[1].click();
    fixture.detectChanges();
    expect(host.value).toEqual(['us-east-1']);
  });

  it('filters options by the typed query', () => {
    trigger().click();
    fixture.detectChanges();
    const box: HTMLInputElement = fixture.debugElement.query(By.css('.hk-select-filter')).nativeElement;
    box.value = 'ap';
    box.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(options().map((el) => el.textContent!.trim())).toEqual(['ap-south-1']);
  });

  it('picks one value and closes in single mode', () => {
    host.multiple.set(false);
    host.value = null;
    fixture.detectChanges();
    expect(trigger().textContent).toContain('Choose regions');
    trigger().click();
    fixture.detectChanges();
    options()[2].click();
    fixture.detectChanges();
    expect(host.value).toBe('ap-south-1');
    expect(options().length).toBe(0);
  });
});
