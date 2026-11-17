import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { HkSliderComponent, HkSliderRange } from './hk-slider.component';

@Component({
  imports: [HkSliderComponent],
  template: `
    <hk-slider id="single" [(value)]="memory" [min]="1" [max]="64" label="Memory limit" suffix=" GB"
      (committed)="committed = $event" />
    <hk-slider id="range" [(range)]="pods" [min]="0" [max]="40" label="pods" suffix=" pods" />
  `
})
class HostComponent {
  readonly memory = signal(16);
  readonly pods = signal<HkSliderRange | null>([4, 18]);
  committed: number | HkSliderRange | null = null;
}

describe('HkSliderComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  const inputs = (id: string): HTMLInputElement[] =>
    fixture.debugElement.queryAll(By.css(`#${id} input[type="range"]`)).map((d) => d.nativeElement);
  const shown = (id: string): string =>
    fixture.nativeElement.querySelector(`#${id} .hk-slider-value`).textContent.trim();

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders one thumb for a value and two for a range', () => {
    expect(inputs('single').length).toBe(1);
    expect(inputs('range').length).toBe(2);
    expect(shown('single')).toBe('16 GB');
    expect(shown('range')).toBe('4 – 18 pods');
  });

  it('two-way binds the value and emits committed on release', () => {
    const [thumb] = inputs('single');
    thumb.value = '32';
    thumb.dispatchEvent(new Event('input'));
    thumb.dispatchEvent(new Event('change'));
    expect(host.memory()).toBe(32);
    expect(host.committed).toBe(32);
  });

  it('clamps range thumbs instead of letting them cross', () => {
    const [low] = inputs('range');
    low.value = '30';
    low.dispatchEvent(new Event('input'));
    expect(host.pods()).toEqual([17, 18]);
  });
});
