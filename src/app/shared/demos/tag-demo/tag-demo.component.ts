import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { HkTagComponent, HkTagTone } from 'hellskitchen-ui';

/** Tones, icons and a remove affordance that actually removes. */
@Component({
  selector: 'app-tag-demo',
  imports: [HkTagComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="w-full max-w-sm space-y-4">
      <div class="flex flex-wrap gap-2">
        @for (tag of tags(); track tag.label) {
          <hk-tag [tone]="tag.tone" [icon]="tag.icon" [removable]="true" (removed)="remove(tag.label)">
            {{ tag.label }}
          </hk-tag>
        } @empty {
          <span class="text-xs text-slate-600 dark:text-gray-400">All removed.</span>
        }
      </div>

      <div class="flex flex-wrap gap-2 border-t border-slate-200/60 dark:border-white/5 pt-4">
        <span class="rounded-md bg-slate-100 dark:bg-white/[0.06] px-2 py-0.5 font-mono text-xs text-slate-700 dark:text-gray-300">v4.2.0</span>
        <span class="rounded-md bg-slate-100 dark:bg-white/[0.06] px-2 py-0.5 font-mono text-xs text-slate-700 dark:text-gray-300">node 22</span>
        <span class="rounded-md bg-slate-100 dark:bg-white/[0.06] px-2 py-0.5 font-mono text-xs text-slate-700 dark:text-gray-300">eu-west-1</span>
      </div>

      <button type="button" (click)="reset()"
        class="rounded-lg border border-slate-200 dark:border-white/10 px-3 py-1.5 text-xs text-slate-700 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white">Reset</button>
    </div>
  `
})
export class TagDemoComponent {
  private readonly seed: { label: string; icon: string; tone: HkTagTone }[] = [
    { label: 'healthy', icon: 'pi pi-check', tone: 'success' },
    { label: 'canary', icon: 'pi pi-bolt', tone: 'warning' },
    { label: 'blocked', icon: 'pi pi-ban', tone: 'danger' },
    { label: 'draft', icon: '', tone: 'neutral' }
  ];

  readonly tags = signal(this.seed);

  remove(label: string): void {
    this.tags.update((list) => list.filter((tag) => tag.label !== label));
  }

  reset(): void {
    this.tags.set(this.seed);
  }
}
