import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HkTimelineComponent, HkTimelineEvent } from './hk-timeline.component';

@Component({
  imports: [HkTimelineComponent],
  template: `
    <hk-timeline [events]="events" [orientation]="orientation()" [markerTemplate]="custom() ? marker : null" />
    <ng-template #marker let-event><b class="custom">{{ event.title[0] }}</b></ng-template>
  `
})
class HostComponent {
  readonly orientation = signal<'vertical' | 'horizontal'>('vertical');
  readonly custom = signal(false);
  readonly events: HkTimelineEvent[] = [
    { at: '09:02', title: 'Build queued', body: 'commit 8f21c4a', tone: 'neutral', datetime: '2026-01-01T09:02' },
    { at: '09:34', title: 'Full ramp', body: 'all regions', tone: 'danger' }
  ];
}

describe('HkTimelineComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  const all = (selector: string): HTMLElement[] => Array.from(fixture.nativeElement.querySelectorAll(selector));

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders an ordered list with machine-readable times and toned markers', () => {
    expect(all('ol > li').length).toBe(2);
    expect(all('time')[0].getAttribute('datetime')).toBe('2026-01-01T09:02');
    expect(all('.hk-timeline-marker')[1].getAttribute('data-tone')).toBe('danger');
    expect(all('.hk-timeline-body')[0].textContent).toContain('commit 8f21c4a');
  });

  it('switches orientation', () => {
    host.orientation.set('horizontal');
    fixture.detectChanges();
    expect(all('ol')[0].getAttribute('data-orientation')).toBe('horizontal');
    expect(all('.hk-timeline-body').length).toBe(0);
  });

  it('renders a custom marker template', () => {
    host.custom.set(true);
    fixture.detectChanges();
    expect(all('.custom').map((b) => b.textContent)).toEqual(['B', 'F']);
  });
});
