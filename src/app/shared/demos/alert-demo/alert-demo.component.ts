import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { HkAlertComponent, HkAlertTone } from 'hellskitchen-ui';

/** Four tones, one shape. Dismissal is real, not a class swap. */
@Component({
  selector: 'app-alert-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HkAlertComponent],
  template: `
    <div class="w-full max-w-md space-y-2.5">
      @for (alert of alerts(); track alert.tone) {
        <hk-alert [tone]="alert.tone" [title]="alert.title" [dismissible]="true" (dismissed)="dismiss(alert.tone)">
          {{ alert.body }}
        </hk-alert>
      } @empty {
        <button type="button" (click)="reset()"
          class="w-full rounded-xl border border-dashed border-slate-200 dark:border-white/10 py-6 text-xs text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white">
          All dismissed — bring them back
        </button>
      }
    </div>
  `
})
export class AlertDemoComponent {
  private readonly seed: { tone: HkAlertTone; title: string; body: string }[] = [
    { tone: 'info', title: 'Maintenance window', body: 'eu-west-1 is read-only from 02:00 UTC.' },
    { tone: 'success', title: 'Deploy finished', body: 'billing-api v4.2.0 is live on all regions.' },
    { tone: 'warning', title: 'Quota at 84%', body: 'Consider raising the concurrency limit.' },
    { tone: 'danger', title: 'Health check failing', body: 'edge-cache-03 has missed three probes.' }
  ];

  readonly alerts = signal(this.seed);

  dismiss(tone: HkAlertTone): void {
    this.alerts.update((list) => list.filter((alert) => alert.tone !== tone));
  }

  reset(): void {
    this.alerts.set(this.seed);
  }
}
