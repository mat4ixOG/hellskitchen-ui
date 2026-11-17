import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HkIntersectDirective } from './hk-intersect.directive';

@Component({
  imports: [HkIntersectDirective],
  template: `
    <div #viewport class="viewport" style="height: 100px; overflow: auto">
      <div style="height: 300px"></div>
      <div hkIntersect [intersectRoot]="viewport" [intersectThreshold]="0.5"
        (entered)="enters = enters + 1" (left)="exits = exits + 1" style="height: 40px">target</div>
      <div style="height: 300px"></div>
    </div>
  `
})
class HostComponent {
  enters = 0;
  exits = 0;
}

describe('HkIntersectDirective', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  const settle = async (done: () => boolean): Promise<void> => {
    const deadline = Date.now() + 2000;
    while (!done() && Date.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.autoDetectChanges();
  });

  it('emits only on transitions, entering and leaving', async () => {
    const viewport: HTMLElement = fixture.nativeElement.querySelector('.viewport');
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(host.enters).toBe(0);
    expect(host.exits).toBe(0);

    viewport.scrollTop = 270;
    await settle(() => host.enters === 1);
    expect(host.enters).toBe(1);

    viewport.scrollTop = 0;
    await settle(() => host.exits === 1);
    expect(host.exits).toBe(1);
  });
});
