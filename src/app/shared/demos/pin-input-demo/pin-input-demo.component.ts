import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { HkPinInputComponent, HkPinInputType } from 'hellskitchen-ui';

export type PinType = HkPinInputType;

/**
 * Six boxes that behave like one field — paste splits, backspace walks back.
 *
 * `type` decides what a box will hold at all. Filtering on the way *in* rather
 * than validating afterwards is what makes a numeric pin feel like a number
 * pad: a letter never appears and then vanishes, it simply never lands. The
 * same filter runs on paste, so a copied code is cleaned by the same rule.
 */
@Component({
  selector: 'app-pin-input-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HkPinInputComponent],
  template: `
    <div class="w-full max-w-sm text-center">
      <p class="mb-3 text-xs text-slate-600 dark:text-gray-400">
        Enter the code we sent to <b class="text-slate-900 dark:text-white">…&#64;example.com</b>
      </p>

      <!-- Mode -->
      <div class="mb-4 flex justify-center gap-1" role="group" aria-label="Allowed characters">
        @for (item of types; track item) {
          <button type="button" (click)="type.set(item)" [attr.aria-pressed]="type() === item"
            [class]="chip(type() === item)">{{ item }}</button>
        }
        <button type="button" (click)="masked.set(!masked())" [attr.aria-pressed]="masked()"
          [class]="chip(masked())">masked</button>
      </div>

      <hk-pin-input [(value)]="code" [length]="length" [type]="type()" [mask]="masked()" />

      <p class="mt-4 text-xs" [class]="complete() ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-600 dark:text-gray-400'">
        {{ complete() ? 'Verified · ' + code() : 'Waiting for ' + remaining() + ' more' }}
      </p>
      <p class="mt-1 text-[0.7rem] text-slate-500 dark:text-gray-500">
        {{ type() === 'numeric' ? 'Letters are rejected — digits only.' : 'Letters and digits both accepted.' }}
      </p>
    </div>
  `
})
export class PinInputDemoComponent {
  readonly length = 6;
  readonly types: PinType[] = ['numeric', 'alphanumeric'];

  readonly type = signal<PinType>('numeric');
  readonly masked = signal(false);
  readonly code = signal('42');

  readonly complete = computed(() => this.code().length === this.length);
  readonly remaining = computed(() => this.length - this.code().length);

  chip(active: boolean): string {
    const base =
      'cursor-pointer rounded-md border px-2 py-0.5 text-[0.72rem] transition-colors';
    return active
      ? `${base} border-red-300 bg-red-50 text-red-700 dark:border-red-700/60 dark:bg-red-950/40 dark:text-red-300`
      : `${base} border-slate-200 text-slate-600 hover:text-slate-900 dark:border-white/10 dark:text-gray-400 dark:hover:text-gray-200`;
  }
}
