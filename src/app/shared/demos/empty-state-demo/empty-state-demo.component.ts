import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { HkEmptyComponent } from 'hellskitchen-ui';

/** The three empty states that actually differ: fresh, filtered, and broken. */
@Component({
  selector: 'app-empty-state-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HkEmptyComponent],
  template: `
    <div class="w-full max-w-sm">
      <div class="flex gap-1.5">
        @for (mode of modes; track mode) {
          <button type="button" (click)="state.set(mode)"
            class="rounded-lg border px-2.5 py-1 text-xs capitalize transition-colors"
            [class]="state() === mode ? 'border-red-300 dark:border-red-700/60 bg-red-50 dark:bg-red-950/40 text-slate-900 dark:text-white' : 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-gray-400'">
            {{ mode }}
          </button>
        }
      </div>

      <hk-empty class="mt-3"
        [icon]="copy().icon"
        [title]="copy().title"
        [body]="copy().body"
        [actionLabel]="copy().action" />
    </div>
  `
})
export class EmptyStateDemoComponent {
  readonly modes = ['fresh', 'filtered', 'error'] as const;
  readonly state = signal<'fresh' | 'filtered' | 'error'>('fresh');

  copy(): { icon: string; title: string; body: string; action: string } {
    switch (this.state()) {
      case 'filtered':
        return {
          icon: 'pi pi-filter-slash',
          title: 'No services match',
          body: 'Three filters are narrowing this list down to nothing. Clearing region usually helps.',
          action: 'Clear filters'
        };
      case 'error':
        return {
          icon: 'pi pi-exclamation-triangle',
          title: 'Could not load services',
          body: 'The control plane returned a 503. Nothing was changed on your side.',
          action: 'Retry'
        };
      default:
        return {
          icon: 'pi pi-server',
          title: 'No services yet',
          body: 'Connect a repository and Hell’s Kitchen will pick up the first deploy automatically.',
          action: 'Connect a repo'
        };
    }
  }
}
