import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * A real page for unknown URLs.
 *
 * This replaced a `redirectTo: ''` wildcard, which answered every bad URL with
 * the homepage and an HTTP 200 — a soft 404 that search engines treat as
 * duplicate content. Prerendered to /404.html, which static hosts serve for
 * unmatched paths with the correct status.
 */
@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="mx-auto flex min-h-[70vh] max-w-3xl flex-col items-center justify-center px-6 text-center">
      <p class="text-sm font-semibold uppercase tracking-[0.2em] text-red-600 dark:text-red-400">404</p>
      <h1 class="mt-4 text-4xl font-black tracking-tight text-slate-900 dark:text-white sm:text-5xl">
        Nothing on this
        <span class="bg-gradient-to-r from-red-500 to-red-700 bg-clip-text text-transparent">burner.</span>
      </h1>
      <p class="mt-5 max-w-md text-slate-600 dark:text-gray-400">
        That page does not exist. The component you are after may have moved, or
        never made it out of the kitchen.
      </p>
      <div class="mt-8 flex flex-wrap items-center justify-center gap-3">
        <a routerLink="/components"
          class="rounded-xl bg-gradient-to-r from-red-600 to-red-800 px-6 py-3 text-sm font-semibold text-white
                 shadow-lg shadow-red-500/25 transition hover:brightness-110 active:scale-95">
          Browse components
        </a>
        <a routerLink="/"
          class="rounded-xl border border-slate-300 dark:border-white/20 px-6 py-3 text-sm font-semibold
                 text-slate-700 dark:text-gray-300 transition hover:border-red-400 dark:hover:border-red-600/50
                 hover:text-slate-900 dark:hover:text-white">
          Back home
        </a>
      </div>
    </section>
  `
})
export class NotFoundComponent {}
