import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';

/**
 * Prefix/suffix slots, input groups and the error state a real form needs.
 *
 * An input group is not a button placed *near* a field — it is one control with
 * one border. The wrapper owns the border and the focus ring; the input inside
 * is stripped bare and the addons are flush against it, so focus lights the
 * whole group rather than a box inside a box.
 */
@Component({
  selector: 'app-input-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="w-full max-w-sm space-y-5">

      <!-- Prefix text + clear -->
      <label class="block">
        <span class="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-gray-400">Workspace URL</span>
        <span class="flex items-center rounded-xl border bg-white transition-colors focus-within:border-red-500 dark:bg-neutral-950 dark:focus-within:border-red-600/70"
          [class]="invalid() ? 'border-red-500 dark:border-red-800/70' : 'border-slate-200 dark:border-white/10'">
          <span class="pl-3 text-sm text-slate-600 dark:text-gray-400">hk.dev/</span>
          <input class="min-w-0 flex-1 bg-transparent px-1 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-white dark:placeholder:text-gray-500"
            placeholder="your-team" [value]="slug()" (input)="slug.set($any($event.target).value)" />
          @if (slug()) {
            <button type="button" class="px-3 text-slate-600 hover:text-slate-900 dark:text-gray-400 dark:hover:text-white"
              (click)="slug.set('')" aria-label="Clear">&times;</button>
          }
        </span>
      </label>

      @if (invalid()) {
        <p class="-mt-3 text-xs text-red-600 dark:text-red-400">Lowercase letters, numbers and dashes only.</p>
      } @else {
        <p class="-mt-3 text-xs text-slate-600 dark:text-gray-400">{{ slug().length }}/24 characters</p>
      }

      <!-- Input group: trailing button -->
      <label class="block">
        <span class="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-gray-400">Invite by email</span>
        <span class="flex items-stretch overflow-hidden rounded-xl border border-slate-200 bg-white transition-colors focus-within:border-red-500 dark:border-white/10 dark:bg-neutral-950 dark:focus-within:border-red-600/70">
          <span class="grid place-items-center pl-3 text-slate-400 dark:text-gray-500"><i class="pi pi-envelope text-xs"></i></span>
          <input type="email" placeholder="you@team.com" [value]="email()"
            (input)="email.set($any($event.target).value)"
            class="min-w-0 flex-1 bg-transparent px-2.5 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-white dark:placeholder:text-gray-500" />
          <button type="button" (click)="invite()" [disabled]="!email()"
            class="shrink-0 border-l border-slate-200 bg-slate-50 px-3.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:bg-white/[0.04] dark:text-gray-200 dark:hover:bg-white/[0.08]">
            Send
          </button>
        </span>
      </label>
      @if (sent()) { <p class="-mt-3 text-xs text-emerald-600 dark:text-emerald-400">Invite sent to {{ sent() }}.</p> }

      <!-- Input group: leading addon + trailing icon button -->
      <label class="block">
        <span class="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-gray-400">Deploy hook</span>
        <span class="flex items-stretch overflow-hidden rounded-xl border border-slate-200 bg-white transition-colors focus-within:border-red-500 dark:border-white/10 dark:bg-neutral-950 dark:focus-within:border-red-600/70">
          <span class="grid shrink-0 place-items-center border-r border-slate-200 bg-slate-50 px-3 text-xs font-medium text-slate-600 dark:border-white/10 dark:bg-white/[0.04] dark:text-gray-400">
            https://
          </span>
          <input readonly [value]="hook"
            class="min-w-0 flex-1 bg-transparent px-2.5 py-2.5 font-mono text-xs text-slate-900 outline-none dark:text-white" />
          <button type="button" (click)="copy()" aria-label="Copy hook URL"
            class="grid w-10 shrink-0 place-items-center border-l border-slate-200 bg-slate-50 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:border-white/10 dark:bg-white/[0.04] dark:text-gray-400 dark:hover:bg-white/[0.08] dark:hover:text-white">
            <i class="pi text-xs" [class]="copied() ? 'pi-check text-emerald-500' : 'pi-copy'"></i>
          </button>
        </span>
      </label>

      <!-- Input group: buttons on both sides (a stepper) -->
      <div>
        <span class="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-gray-400">Seat count</span>
        <span class="flex items-stretch overflow-hidden rounded-xl border border-slate-200 bg-white transition-colors focus-within:border-red-500 dark:border-white/10 dark:bg-neutral-950 dark:focus-within:border-red-600/70">
          <button type="button" (click)="step(-1)" [disabled]="seats() <= 1" aria-label="One fewer seat"
            class="w-10 shrink-0 border-r border-slate-200 bg-slate-50 text-sm text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-40 dark:border-white/10 dark:bg-white/[0.04] dark:text-gray-200 dark:hover:bg-white/[0.08]">
            −
          </button>
          <input type="number" min="1" [value]="seats()" aria-label="Seat count"
            (input)="seats.set(clamp(+$any($event.target).value))"
            class="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-center text-sm text-slate-900 outline-none dark:text-white" />
          <button type="button" (click)="step(1)" aria-label="One more seat"
            class="w-10 shrink-0 border-l border-slate-200 bg-slate-50 text-sm text-slate-700 transition-colors hover:bg-slate-100 dark:border-white/10 dark:bg-white/[0.04] dark:text-gray-200 dark:hover:bg-white/[0.08]">
            +
          </button>
        </span>
        <p class="mt-1.5 text-xs text-slate-600 dark:text-gray-400">
          Billed monthly: <b class="text-slate-900 dark:text-white">\${{ seats() * 12 }}</b>
        </p>
      </div>
    </div>
  `
})
export class InputDemoComponent {
  readonly hook = 'hk.dev/hooks/9f2c-41ab-7e10';

  readonly slug = signal('night-shift');
  readonly seats = signal(4);
  readonly email = signal('');
  readonly sent = signal('');
  readonly copied = signal(false);

  readonly invalid = computed(
    () => this.slug().length > 0 && !/^[a-z0-9-]{1,24}$/.test(this.slug())
  );

  clamp(value: number): number {
    return Number.isNaN(value) ? 1 : Math.max(1, Math.trunc(value));
  }

  step(delta: number): void {
    this.seats.update((seats) => this.clamp(seats + delta));
  }

  invite(): void {
    if (!this.email()) return;
    this.sent.set(this.email());
    this.email.set('');
  }

  copy(): void {
    navigator.clipboard?.writeText(`https://${this.hook}`).catch(() => undefined);
    this.copied.set(true);
    setTimeout(() => this.copied.set(false), 1600);
  }
}
