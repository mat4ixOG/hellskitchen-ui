import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

/** Accepts free text as well as a match — the "add what I typed" case. */
@Component({
  selector: 'app-combobox-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="w-full max-w-sm">
      <div class="flex flex-wrap items-center gap-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-neutral-950 p-2 focus-within:border-red-500 dark:focus-within:border-red-600/70">
        @for (tag of tags(); track tag) {
          <span class="inline-flex items-center gap-1 rounded-lg bg-red-100 dark:bg-red-950/60 px-2 py-0.5 text-xs text-red-700 dark:text-red-300">
            {{ tag }}
            <button type="button" class="text-red-400/70 hover:text-red-800 dark:hover:text-red-200" (click)="remove(tag)"
              [attr.aria-label]="'Remove ' + tag">&times;</button>
          </span>
        }
        <input class="min-w-24 flex-1 bg-transparent px-1 py-1 text-sm text-slate-900 dark:text-white outline-none placeholder:text-slate-400 dark:placeholder:text-gray-500"
          placeholder="Add a label…" [value]="draft()"
          (input)="draft.set($any($event.target).value)"
          (keydown.enter)="commit()" (keydown.backspace)="onBackspace()" />
      </div>

      @if (suggestions().length) {
        <ul class="mt-1.5 overflow-hidden rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-neutral-950">
          @for (item of suggestions(); track item) {
            <li>
              <button type="button" (click)="add(item)"
                class="w-full px-3 py-1.5 text-left text-sm text-slate-700 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-white/5">{{ item }}</button>
            </li>
          }
        </ul>
      } @else if (draft().trim()) {
        <p class="mt-1.5 text-xs text-slate-600 dark:text-gray-400">Enter to create “<b class="text-slate-900 dark:text-white">{{ draft() }}</b>”</p>
      }
    </div>
  `
})
export class ComboboxDemoComponent {
  private readonly pool = ['bug', 'regression', 'perf', 'a11y', 'docs', 'infra', 'design'];

  readonly tags = signal<string[]>(['perf']);
  readonly draft = signal('');

  suggestions(): string[] {
    const draft = this.draft().trim().toLowerCase();
    if (!draft) return [];
    return this.pool.filter((item) => item.includes(draft) && !this.tags().includes(item));
  }

  add(tag: string): void {
    if (!this.tags().includes(tag)) this.tags.update((list) => [...list, tag]);
    this.draft.set('');
  }

  commit(): void {
    const value = this.draft().trim();
    if (value) this.add(value);
  }

  remove(tag: string): void {
    this.tags.update((list) => list.filter((item) => item !== tag));
  }

  /** Backspace on an empty field peels the last tag, like every tag input should. */
  onBackspace(): void {
    if (this.draft()) return;
    this.tags.update((list) => list.slice(0, -1));
  }
}
