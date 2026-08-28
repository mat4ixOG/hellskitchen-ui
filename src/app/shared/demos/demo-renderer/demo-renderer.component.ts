import { NgComponentOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, Type, computed, effect, input, signal, untracked } from '@angular/core';
import { DEMOS } from '../demo-registry';

/** Kept as an alias so callers can keep talking in terms of demo ids. */
export type DemoId = string;

/**
 * Resolves a demo by slug and instantiates it, so the homepage showcase and
 * the docs pages render the exact same instance — one demo, two places.
 * Demos are code-split: only the one on screen is ever downloaded.
 */
@Component({
  selector: 'app-demo-renderer',
  imports: [NgComponentOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (loaded(); as component) {
      <ng-container *ngComponentOutlet="component; inputs: inputs()" />
    } @else if (missing()) {
      <p class="text-sm text-slate-600 dark:text-gray-400">No demo registered for “{{ demo() }}”.</p>
    } @else {
      <div class="h-24 w-full animate-pulse rounded-xl border border-slate-200/60 dark:border-white/5 bg-slate-50 dark:bg-white/[0.03]"></div>
    }
  `
})
export class DemoRendererComponent {
  readonly demo = input.required<DemoId>();

  readonly loaded = signal<Type<unknown> | null>(null);
  readonly missing = signal(false);

  /**
   * Passed to every demo. Components that declare a `slug` input receive it;
   * the rest ignore it. This is how the eight backgrounds share one stage
   * component yet each open on their own background.
   */
  readonly inputs = computed(() => ({ slug: this.demo() }));

  constructor() {
    effect(() => {
      const slug = this.demo();
      const loader = DEMOS[slug];
      this.loaded.set(null);
      this.missing.set(!loader);
      if (!loader) return;

      // The await lands outside the reactive context; re-check the input in
      // case the user clicked through to another demo while this was in flight.
      loader()
        .then((component) => {
          if (untracked(() => this.demo()) === slug) this.loaded.set(component);
        })
        .catch(() => this.missing.set(true));
    });
  }
}
