import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';

interface Accent {
  name: string;
  value: string;
}

/**
 * Rewrites the token layer at runtime — no rebuild, no class swap.
 *
 * Every swatch is one value written to `--hk-accent`. The preview derives its
 * fills, tints and borders from that one variable with `color-mix`, which is
 * why a new accent is a single line here rather than a palette of five shades:
 * the ramp is computed, not authored.
 */
@Component({
  selector: 'app-theme-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="w-full max-w-sm">
      <div class="rounded-2xl border p-5 transition-colors duration-300"
        [style.--demo-accent]="accent()"
        [style.border-radius.px]="radius()"
        [style.border-color]="mix(38)"
        [style.background]="'color-mix(in srgb, ' + accent() + ' 8%, var(--surface))'">
        <div class="flex items-center justify-between">
          <p class="text-sm font-bold" [style.color]="accent()">Deploy summary</p>
          <span class="rounded-full px-2 py-0.5 text-[0.7rem] font-semibold"
            [style.background]="mix(16)" [style.color]="accent()"
            [style.border-radius.px]="radius()">canary</span>
        </div>
        <p class="mt-1 text-xs text-slate-600 dark:text-gray-400">Every component reads the same variables.</p>

        <div class="mt-3 h-1.5 overflow-hidden rounded-full" [style.background]="mix(15)"
          [style.border-radius.px]="radius() / 3">
          <span class="block h-full w-2/3 rounded-full" [style.background]="accent()"
            [style.border-radius.px]="radius() / 3"></span>
        </div>

        <div class="mt-3 flex gap-2">
          <button type="button" class="px-3 py-1.5 text-xs font-semibold text-white"
            [style.background]="accent()" [style.border-radius.px]="radius() / 2">Primary</button>
          <button type="button" class="border px-3 py-1.5 text-xs"
            [style.border-color]="mix(45)" [style.color]="accent()"
            [style.border-radius.px]="radius() / 2">Ghost</button>
          <button type="button" class="px-3 py-1.5 text-xs font-semibold"
            [style.background]="mix(14)" [style.color]="accent()"
            [style.border-radius.px]="radius() / 2">Soft</button>
        </div>
      </div>

      <div class="mt-4 space-y-3">
        <div>
          <span class="text-[0.7rem] font-semibold uppercase tracking-wide text-slate-500 dark:text-gray-500">
            Accent — {{ current().name }}
          </span>
          <div class="mt-2 flex flex-wrap gap-2">
            @for (colour of palette; track colour.value) {
              <button type="button" (click)="accent.set(colour.value)"
                class="h-6 w-6 rounded-full ring-2 ring-offset-2 ring-offset-white transition hover:scale-110 dark:ring-offset-neutral-950"
                [style.background]="colour.value"
                [style.--tw-ring-color]="accent() === colour.value ? colour.value : 'transparent'"
                [attr.aria-pressed]="accent() === colour.value"
                [attr.aria-label]="'Accent ' + colour.name"
                [title]="colour.name"></button>
            }
          </div>
        </div>

        <!-- Any CSS colour works, so the swatches are a shortcut, not the API. -->
        <label class="flex items-center gap-2 text-xs text-slate-600 dark:text-gray-400">
          <span class="w-14 shrink-0">Custom</span>
          <input type="color" [value]="accent()" (input)="accent.set($any($event.target).value)"
            class="h-7 w-10 cursor-pointer rounded border border-slate-200 bg-transparent dark:border-white/10"
            aria-label="Custom accent" />
          <code class="font-mono text-[0.72rem] text-slate-500 dark:text-gray-500">--hk-accent: {{ accent() }}</code>
        </label>

        <label class="flex items-center gap-2 text-xs text-slate-600 dark:text-gray-400">
          <span class="w-14 shrink-0">Radius</span>
          <input type="range" min="0" max="28" [value]="radius()"
            (input)="radius.set(+$any($event.target).value)" class="flex-1 accent-red-600" />
          <span class="w-8 text-right font-mono">{{ radius() }}</span>
        </label>
      </div>
    </div>
  `
})
export class ThemeDemoComponent {
  readonly palette: Accent[] = [
    { name: 'Crimson', value: '#dc2626' },
    { name: 'Rose', value: '#e11d48' },
    { name: 'Orange', value: '#ea580c' },
    { name: 'Amber', value: '#f59e0b' },
    { name: 'Lime', value: '#65a30d' },
    { name: 'Emerald', value: '#10b981' },
    { name: 'Teal', value: '#0d9488' },
    { name: 'Cyan', value: '#06b6d4' },
    { name: 'Sky', value: '#0ea5e9' },
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Indigo', value: '#6366f1' },
    { name: 'Violet', value: '#8b5cf6' },
    { name: 'Purple', value: '#a855f7' },
    { name: 'Fuchsia', value: '#d946ef' },
    { name: 'Pink', value: '#ec4899' },
    { name: 'Slate', value: '#64748b' }
  ];

  readonly accent = signal('#dc2626');
  readonly radius = signal(16);

  readonly current = computed(
    () => this.palette.find((item) => item.value === this.accent()) ?? { name: 'Custom', value: this.accent() }
  );

  /** One accent, mixed down to whatever weight a surface needs. */
  mix(percent: number): string {
    return `color-mix(in srgb, ${this.accent()} ${percent}%, transparent)`;
  }
}
