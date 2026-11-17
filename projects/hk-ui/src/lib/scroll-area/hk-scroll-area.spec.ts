import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { HkScrollAreaComponent, HkScrollAreaEdges } from './hk-scroll-area.component';

@Component({
  imports: [HkScrollAreaComponent],
  template: `
    <hk-scroll-area maxHeight="100px" (scrolled)="edges.push($event)">
      @for (row of rows; track row) {
        <div style="height: 40px">row {{ row }}</div>
      }
    </hk-scroll-area>
  `
})
class HostComponent {
  readonly rows = Array.from({ length: 10 }, (_, index) => index);
  edges: HkScrollAreaEdges[] = [];
}

describe('HkScrollAreaComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  const area = (): HTMLElement => fixture.debugElement.query(By.css('hk-scroll-area')).nativeElement;
  const viewport = (): HTMLElement => area().querySelector('.hk-scroll-viewport') as HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.autoDetectChanges();
    await fixture.whenStable();
  });

  it('is a focusable viewport capped at maxHeight', () => {
    expect(viewport().getAttribute('tabindex')).toBe('0');
    expect(viewport().style.maxHeight).toBe('100px');
  });

  it('measures the edges after render: only the bottom fade shows at the top', () => {
    expect(area().querySelector('.hk-scroll-fade.is-top')).toBeNull();
    expect(area().querySelector('.hk-scroll-fade.is-bottom')).toBeTruthy();
  });

  it('emits and swaps fades when scrolled to the end', async () => {
    viewport().scrollTop = viewport().scrollHeight;
    viewport().dispatchEvent(new Event('scroll'));
    await fixture.whenStable();
    expect(host.edges.at(-1)).toEqual({ top: false, bottom: true });
    expect(area().querySelector('.hk-scroll-fade.is-top')).toBeTruthy();
    expect(area().querySelector('.hk-scroll-fade.is-bottom')).toBeNull();
  });
});
