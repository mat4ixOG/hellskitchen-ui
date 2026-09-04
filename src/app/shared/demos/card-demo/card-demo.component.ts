import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

/**
 * Media, header, body and footer — every slot independent of the others.
 *
 * The slots do not imply one another. Turning the media on does not oblige you
 * to drop the copy, and dropping the copy does not take the media with it: a
 * media-only tile, a text-only row and the full card are all the same component
 * with different slots filled. The card only supplies the padding and the rules
 * between whatever is actually present, which is why nothing collapses into a
 * stray gap when a slot is empty.
 */
@Component({
  selector: 'app-card-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="w-full max-w-sm">
      <article class="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-neutral-950">
        @if (media()) {
          <div class="grid h-24 place-items-center bg-gradient-to-br from-red-500 via-red-600 to-red-800">
            <i class="pi pi-server text-2xl text-white/70"></i>
          </div>
        }

        @if (header()) {
          <!-- With no body under it the header owns the bottom padding,
               or its text sits flush against the footer rule. -->
          <header class="flex items-start justify-between gap-3 px-4 pt-4"
            [class.pb-4]="!body()">
            <div>
              <h3 class="text-sm font-bold text-slate-900 dark:text-white">billing-api</h3>
              <p class="mt-0.5 text-xs text-slate-600 dark:text-gray-400">eu-west-1 · v4.2.0</p>
            </div>
            <span class="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[0.72rem] font-semibold text-emerald-700 dark:border-emerald-800/50 dark:bg-emerald-950/40 dark:text-emerald-300">
              healthy
            </span>
          </header>
        }

        @if (body()) {
          <p class="px-4 text-xs leading-relaxed text-slate-600 dark:text-gray-400"
            [class]="header() ? 'py-3' : 'py-4'">
            Handles invoicing and dunning. Owns the ledger write path, so deploys go out canary-first.
          </p>
        }

        @if (footer()) {
          <footer class="flex items-center justify-between border-slate-200/60 px-4 py-2.5 dark:border-white/5"
            [class.border-t]="header() || body()">
            <span class="text-xs text-slate-600 dark:text-gray-400">Updated 14 min ago</span>
            <button type="button" class="text-xs font-semibold text-red-600 hover:text-red-700 dark:text-red-400">Open →</button>
          </footer>
        }

        <!-- Every slot off is still a valid card, so it has to say so rather
             than render as an empty box. -->
        @if (!media() && !header() && !body() && !footer()) {
          <p class="px-4 py-8 text-center text-xs text-slate-500 dark:text-gray-500">Every slot is empty.</p>
        }
      </article>

      <div class="mt-3 flex flex-wrap gap-1.5" role="group" aria-label="Slots">
        @for (slot of slots; track slot.id) {
          <button type="button" (click)="toggle(slot.id)" [attr.aria-pressed]="slot.on()"
            [class]="chip(slot.on())">
            <i class="pi mr-1 text-[0.6rem]" [class]="slot.on() ? 'pi-check' : 'pi-plus'"></i>{{ slot.label }}
          </button>
        }
      </div>
      <p class="mt-2 text-xs text-slate-500 dark:text-gray-500">
        Each slot is its own input — toggle any combination.
      </p>
    </div>
  `
})
export class CardDemoComponent {
  readonly media = signal(true);
  readonly header = signal(true);
  readonly body = signal(true);
  readonly footer = signal(true);

  readonly slots = [
    { id: 'media' as const, label: 'Media', on: this.media },
    { id: 'header' as const, label: 'Header', on: this.header },
    { id: 'body' as const, label: 'Body', on: this.body },
    { id: 'footer' as const, label: 'Footer', on: this.footer }
  ];

  toggle(id: 'media' | 'header' | 'body' | 'footer'): void {
    const slot = this.slots.find((item) => item.id === id);
    slot?.on.update((on) => !on);
  }

  chip(active: boolean): string {
    const base = 'cursor-pointer rounded-md border px-2.5 py-1 text-xs transition-colors';
    return active
      ? `${base} border-red-300 bg-red-50 text-red-700 dark:border-red-700/60 dark:bg-red-950/40 dark:text-red-300`
      : `${base} border-slate-200 text-slate-600 hover:text-slate-900 dark:border-white/10 dark:text-gray-400 dark:hover:text-white`;
  }
}
