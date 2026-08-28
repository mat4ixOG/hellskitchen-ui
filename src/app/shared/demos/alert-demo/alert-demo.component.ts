import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

type Tone = 'info' | 'success' | 'warning' | 'danger';

/** Four tones, one shape. Dismissal is real, not a class swap. */
@Component({
  selector: 'app-alert-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="w-full max-w-md space-y-2.5">
      @for (alert of alerts(); track alert.tone) {
        <div role="alert" class="flex items-start gap-3 rounded-xl border p-3" [class]="skin(alert.tone)">
          <i [class]="icon(alert.tone) + ' mt-0.5 text-sm'"></i>
          <div class="flex-1">
            <p class="text-sm font-semibold">{{ alert.title }}</p>
            <p class="mt-0.5 text-xs opacity-80">{{ alert.body }}</p>
          </div>
          <button type="button" class="opacity-60 hover:opacity-100" (click)="dismiss(alert.tone)"
            [attr.aria-label]="'Dismiss ' + alert.title">&times;</button>
        </div>
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
  private readonly seed: { tone: Tone; title: string; body: string }[] = [
    { tone: 'info', title: 'Maintenance window', body: 'eu-west-1 is read-only from 02:00 UTC.' },
    { tone: 'success', title: 'Deploy finished', body: 'billing-api v4.2.0 is live on all regions.' },
    { tone: 'warning', title: 'Quota at 84%', body: 'Consider raising the concurrency limit.' },
    { tone: 'danger', title: 'Health check failing', body: 'edge-cache-03 has missed three probes.' }
  ];

  readonly alerts = signal(this.seed);

  skin(tone: Tone): string {
    const map: Record<Tone, string> = {
      info: 'border-sky-200 dark:border-sky-800/50 bg-sky-50 dark:bg-sky-950/40 text-sky-800 dark:text-sky-200',
      success: 'border-emerald-200 dark:border-emerald-800/50 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200',
      warning: 'border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200',
      danger: 'border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-200'
    };
    return map[tone];
  }

  icon(tone: Tone): string {
    const map: Record<Tone, string> = {
      info: 'pi pi-info-circle',
      success: 'pi pi-check-circle',
      warning: 'pi pi-exclamation-triangle',
      danger: 'pi pi-times-circle'
    };
    return map[tone];
  }

  dismiss(tone: Tone): void {
    this.alerts.update((list) => list.filter((alert) => alert.tone !== tone));
  }

  reset(): void {
    this.alerts.set(this.seed);
  }
}
