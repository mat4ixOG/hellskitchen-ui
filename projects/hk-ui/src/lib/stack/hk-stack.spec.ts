import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { HkStackComponent, HkStackDirection } from './hk-stack.component';

@Component({
  imports: [HkStackComponent],
  template: `
    <hk-stack [direction]="direction()" [gap]="gap()" align="center" justify="between" [wrap]="true">
      <span>one</span><span>two</span>
    </hk-stack>
  `
})
class HostComponent {
  readonly direction = signal<HkStackDirection>('row');
  readonly gap = signal('0.75rem');
}

describe('HkStackComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  const stack = (): HTMLElement => fixture.debugElement.query(By.css('hk-stack')).nativeElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('lays its children out as a flex row with the given gap', () => {
    const style = getComputedStyle(stack());
    expect(style.display).toBe('flex');
    expect(stack().style.flexDirection).toBe('row');
    expect(stack().style.gap).toBe('0.75rem');
    expect(stack().style.alignItems).toBe('center');
    expect(stack().style.justifyContent).toBe('space-between');
    expect(stack().style.flexWrap).toBe('wrap');
    expect(stack().children.length).toBe(2);
  });

  it('switches direction', () => {
    host.direction.set('column');
    fixture.detectChanges();
    expect(stack().style.flexDirection).toBe('column');
  });
});
