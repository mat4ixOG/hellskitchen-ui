import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

/** Vertical or horizontal rail, with a marker per event tone. */
@Component({
  selector: 'app-timeline-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="w-full max-w-sm">
      @if (vertical()) {
        <ol class="relative ml-2 border-l border-slate-200 dark:border-white/10 pl-5">
          @for (event of events; track event.at) {
            <li class="relative pb-5 last:pb-0">
              <span class="absolute -left-[1.6rem] top-1 h-2.5 w-2.5 rounded-full ring-4 ring-white dark:ring-black" [class]="event.dot"></span>
              <p class="text-xs font-semibold text-slate-900 dark:text-white">{{ event.title }}</p>
              <p class="mt-0.5 text-xs text-slate-600 dark:text-gray-400">{{ event.at }} · {{ event.body }}</p>
            </li>
          }
        </ol>
      } @else {
        <ol class="flex items-start gap-1 overflow-x-auto pb-2">
          @for (event of events; track event.at) {
            <li class="min-w-28 flex-1">
              <span class="mb-2 block h-0.5 w-full" [class]="event.dot"></span>
              <p class="text-xs font-semibold text-slate-900 dark:text-white">{{ event.title }}</p>
              <p class="text-[0.72rem] text-slate-600 dark:text-gray-400">{{ event.at }}</p>
            </li>
          }
        </ol>
      }

      <button type="button" (click)="vertical.set(!vertical())"
        class="mt-3 rounded-lg border border-slate-200 dark:border-white/10 px-3 py-1.5 text-xs text-slate-700 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white">
        {{ vertical() ? 'Horizontal' : 'Vertical' }}
      </button>
    </div>
  `
})
export class TimelineDemoComponent {
  readonly vertical = signal(true);
  readonly events = [
    { at: '09:02', title: 'Build queued', body: 'commit 8f21c4a', dot: 'bg-gray-500' },
    { at: '09:06', title: 'Canary at 5%', body: 'eu-west-1', dot: 'bg-amber-500' },
    { at: '09:31', title: 'Error rate normal', body: '0.02% over 25 min', dot: 'bg-emerald-500' },
    { at: '09:34', title: 'Full ramp', body: 'all regions on v4.2.0', dot: 'bg-red-600' }
  ];
}
