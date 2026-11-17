import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { HkPinInputComponent, HkPinInputType } from './hk-pin-input.component';

@Component({
  imports: [HkPinInputComponent],
  template: `<hk-pin-input [(value)]="code" [length]="4" [type]="type()" [mask]="mask()"
    (completed)="done = $event" />`
})
class HostComponent {
  readonly code = signal('42');
  readonly type = signal<HkPinInputType>('numeric');
  readonly mask = signal(false);
  done = '';
}

describe('HkPinInputComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  const boxes = (): HTMLInputElement[] =>
    fixture.debugElement.queryAll(By.css('input')).map((d) => d.nativeElement);
  const type = (index: number, text: string): void => {
    boxes()[index].value = text;
    boxes()[index].dispatchEvent(new Event('input'));
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders one box per character of length', () => {
    expect(boxes().length).toBe(4);
    expect(boxes().map((b) => b.value)).toEqual(['4', '2', '', '']);
  });

  it('rejects characters the type does not allow', () => {
    type(2, 'a');
    expect(boxes()[2].value).toBe('');
    expect(host.code()).toBe('42');
  });

  it('two-way binds and emits completed once full', () => {
    type(2, '7');
    expect(host.code()).toBe('427');
    expect(host.done).toBe('');
    type(3, '1');
    expect(host.code()).toBe('4271');
    expect(host.done).toBe('4271');
  });

  it('masks the boxes', () => {
    host.mask.set(true);
    fixture.detectChanges();
    expect(boxes()[0].type).toBe('password');
  });
});
