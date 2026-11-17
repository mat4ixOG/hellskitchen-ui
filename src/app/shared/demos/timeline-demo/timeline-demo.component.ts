import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { HkTimelineComponent, HkTimelineEvent } from 'hellskitchen-ui';

/** Vertical or horizontal rail, with a marker per event tone. */
@Component({
  selector: 'app-timeline-demo',
  imports: [HkTimelineComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="w-full max-w-sm">
      <hk-timeline [events]="events" [orientation]="vertical() ? 'vertical' : 'horizontal'" />

      <button type="button" (click)="vertical.set(!vertical())"
        class="mt-3 rounded-lg border border-slate-200 dark:border-white/10 px-3 py-1.5 text-xs text-slate-700 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white">
        {{ vertical() ? 'Horizontal' : 'Vertical' }}
      </button>
    </div>
  `
})
export class TimelineDemoComponent {
  readonly vertical = signal(true);
  readonly events: HkTimelineEvent[] = [
    { at: '09:02', title: 'Build queued', body: 'commit 8f21c4a', tone: 'neutral' },
    { at: '09:06', title: 'Canary at 5%', body: 'eu-west-1', tone: 'warning' },
    { at: '09:31', title: 'Error rate normal', body: '0.02% over 25 min', tone: 'success' },
    { at: '09:34', title: 'Full ramp', body: 'all regions on v4.2.0', tone: 'danger' }
  ];
}
