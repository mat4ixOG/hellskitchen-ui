import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

/** Tones, icons and a remove affordance that actually removes. */
@Component({
  selector: 'app-tag-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="w-full max-w-sm space-y-4">
      <div class="flex flex-wrap gap-2">
        @for (tag of tags(); track tag.label) {
          <span class="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium"
            [class]="tag.skin">
            @if (tag.icon) { <i [class]="tag.icon + ' text-[0.72rem]'"></i> }
            {{ tag.label }}
            <button type="button" class="opacity-60 hover:opacity-100" (click)="remove(tag.label)"
              [attr.aria-label]="'Remove ' + tag.label">&times;</button>
          </span>
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
  private readonly seed = [
    { label: 'healthy', icon: 'pi pi-check', skin: 'border-emerald-200 dark:border-emerald-800/50 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300' },
    { label: 'canary', icon: 'pi pi-bolt', skin: 'border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300' },
    { label: 'blocked', icon: 'pi pi-ban', skin: 'border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300' },
    { label: 'draft', icon: '', skin: 'border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-gray-300' }
  ];

  readonly tags = signal(this.seed);

  remove(label: string): void {
    this.tags.update((list) => list.filter((tag) => tag.label !== label));
  }

  reset(): void {
    this.tags.set(this.seed);
  }
}
