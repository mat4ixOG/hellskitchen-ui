import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import {
  HkSkeletonCircleComponent,
  HkSkeletonComponent,
  HkSkeletonLineComponent,
  HkSkeletonMotion
} from './hk-skeleton.component';

@Component({
  imports: [HkSkeletonComponent, HkSkeletonLineComponent, HkSkeletonCircleComponent],
  template: `
    <hk-skeleton [loading]="loading()" [motion]="motion()">
      <hk-skeleton-circle size="2.75rem" />
      <hk-skeleton-line width="80%" [lines]="3" />
      <p class="real">Loaded</p>
    </hk-skeleton>
  `
})
class HostComponent {
  readonly loading = signal(true);
  readonly motion = signal<HkSkeletonMotion>('shimmer');
}

describe('HkSkeletonComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  const container = (): HTMLElement => fixture.debugElement.query(By.css('hk-skeleton')).nativeElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('shows placeholders while loading and marks itself busy', () => {
    expect(container().getAttribute('aria-busy')).toBe('true');
    expect(container().querySelector('.real')).toBeNull();
    expect(container().querySelectorAll('hk-skeleton-line .hk-sk').length).toBe(3);
    const circle = container().querySelector('hk-skeleton-circle .hk-sk') as HTMLElement;
    expect(circle.style.width).toBe('2.75rem');
  });

  it('tapers the last of several lines', () => {
    const lines = container().querySelectorAll<HTMLElement>('hk-skeleton-line .hk-sk');
    expect(lines[0].style.width).toBe('80%');
    expect(lines[2].style.width).toBe('60%');
  });

  it('inherits the motion from the container', () => {
    host.motion.set('pulse');
    fixture.detectChanges();
    expect(container().querySelector('.hk-sk')?.classList).toContain('hk-sk-pulse');
  });

  it('projects the real content when loaded', () => {
    host.loading.set(false);
    fixture.detectChanges();
    expect(container().querySelector('.real')).toBeTruthy();
    expect(container().querySelector('hk-skeleton-line')).toBeNull();
    expect(container().getAttribute('aria-busy')).toBe('false');
  });
});
