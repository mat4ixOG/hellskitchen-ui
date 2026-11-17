import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { HkComboboxComponent } from './hk-combobox.component';

@Component({
  imports: [HkComboboxComponent],
  template: `
    <hk-combobox [(value)]="tags" [options]="pool" [allowCustom]="allowCustom()" />
  `
})
class HostComponent {
  readonly pool = ['bug', 'regression', 'perf', 'a11y', 'docs'];
  readonly allowCustom = signal(true);
  tags = ['perf'];
}

describe('HkComboboxComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  const input = (): HTMLInputElement => fixture.debugElement.query(By.css('input')).nativeElement;
  const type = (value: string): void => {
    input().value = value;
    input().dispatchEvent(new Event('input'));
    fixture.detectChanges();
  };
  const key = (name: string): void => {
    input().dispatchEvent(new KeyboardEvent('keydown', { key: name, bubbles: true, cancelable: true }));
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders the chosen values as chips', () => {
    expect(fixture.debugElement.queryAll(By.css('.hk-cb-chip')).length).toBe(1);
  });

  it('suggests matches and adds a clicked suggestion', () => {
    type('re');
    const options = fixture.debugElement.queryAll(By.css('.hk-cb-option'));
    expect(options.map((el) => el.nativeElement.textContent.trim())).toEqual(['regression']);
    options[0].nativeElement.click();
    fixture.detectChanges();
    expect(host.tags).toEqual(['perf', 'regression']);
  });

  it('commits free text on Enter only when allowCustom is on', () => {
    type('infra');
    key('Enter');
    expect(host.tags).toEqual(['perf', 'infra']);

    host.allowCustom.set(false);
    fixture.detectChanges();
    type('design');
    key('Enter');
    expect(host.tags).toEqual(['perf', 'infra']);
  });

  it('peels the last chip on Backspace in an empty field', () => {
    key('Backspace');
    expect(host.tags).toEqual([]);
  });
});
