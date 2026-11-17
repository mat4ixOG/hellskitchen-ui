import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { HkInputAddonDirective, HkInputComponent, HkInputGroupComponent } from 'hellskitchen-ui';

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
  imports: [HkInputComponent, HkInputGroupComponent, HkInputAddonDirective],
  template: `
    <div class="w-full max-w-sm space-y-5">

      <!-- Prefix text + clear -->
      <hk-input
        [(value)]="slug"
        label="Workspace URL"
        prefix="hk.dev/"
        placeholder="your-team"
        [hint]="slug().length + '/24 characters'"
        [error]="invalid() ? 'Lowercase letters, numbers and dashes only.' : ''"
        [clearable]="true" />

      <!-- Input group: trailing button -->
      <label class="block">
        <span class="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-gray-400">Invite by email</span>
        <hk-input-group>
          <span class="grid place-items-center pl-3 text-slate-400 dark:text-gray-500"><i class="pi pi-envelope text-xs"></i></span>
          <hk-input [(value)]="email" type="email" placeholder="you@team.com" class="[&_input]:px-2.5" />
          <button type="button" hkInputAddon (click)="invite()" [disabled]="!email()" class="px-3.5">
            Send
          </button>
        </hk-input-group>
      </label>
      @if (sent()) { <p class="-mt-3 text-xs text-emerald-600 dark:text-emerald-400">Invite sent to {{ sent() }}.</p> }

      <!-- Input group: leading addon + trailing icon button -->
      <label class="block">
        <span class="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-gray-400">Deploy hook</span>
        <hk-input-group>
          <hk-input addonBefore="https://" [value]="hook" [readonly]="true"
            class="[&_input]:px-2.5 [&_input]:font-mono [&_input]:text-xs" />
          <button type="button" hkInputAddon (click)="copy()" aria-label="Copy hook URL"
            class="w-10 px-0 text-slate-600 hover:text-slate-900 dark:text-gray-400 dark:hover:text-white">
            <i class="pi text-xs" [class]="copied() ? 'pi-check text-emerald-500' : 'pi-copy'"></i>
          </button>
        </hk-input-group>
      </label>

      <!-- Input group: buttons on both sides (a stepper) -->
      <div>
        <span class="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-gray-400">Seat count</span>
        <hk-input-group>
          <button type="button" hkInputAddon (click)="step(-1)" [disabled]="seats() <= 1" aria-label="One fewer seat"
            class="w-10 px-0 text-sm font-normal">
            −
          </button>
          <hk-input type="number" label="Seat count" [value]="'' + seats()"
            (valueChange)="seats.set(clamp(+$event))" class="text-center [&_input]:px-3" />
          <button type="button" hkInputAddon (click)="step(1)" aria-label="One more seat"
            class="w-10 px-0 text-sm font-normal">
            +
          </button>
        </hk-input-group>
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
