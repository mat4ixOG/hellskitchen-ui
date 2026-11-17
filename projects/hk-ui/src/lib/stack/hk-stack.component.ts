import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type HkStackDirection = 'row' | 'column';
export type HkStackAlign = 'start' | 'center' | 'end' | 'stretch';
export type HkStackJustify = 'start' | 'center' | 'end' | 'between';

const HK_STACK_FLEX: Record<string, string> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  stretch: 'stretch',
  between: 'space-between'
};

/** Flex row or column with token-driven gaps. Purely presentational. */
@Component({
  selector: 'hk-stack',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'hk-stack',
    '[style.flex-direction]': 'direction()',
    '[style.gap]': 'gap() || null',
    '[style.align-items]': 'alignItems()',
    '[style.justify-content]': 'justifyContent()',
    '[style.flex-wrap]': 'wrap() ? "wrap" : "nowrap"'
  },
  template: `<ng-content />`,
  styles: `
    @layer components {
      :host {
        display: flex;
        gap: var(--hk-stack-gap, 0.5rem);
      }
    }
  `
})
export class HkStackComponent {
  /** Main axis. */
  readonly direction = input<HkStackDirection>('column');
  /** Space between children. Empty falls back to `--hk-stack-gap` (0.5rem). */
  readonly gap = input('');
  /** Cross-axis alignment. */
  readonly align = input<HkStackAlign>('stretch');
  /** Main-axis distribution. */
  readonly justify = input<HkStackJustify>('start');
  /** Allows children to wrap. */
  readonly wrap = input(false);

  readonly alignItems = computed(() => HK_STACK_FLEX[this.align()] ?? 'stretch');
  readonly justifyContent = computed(() => HK_STACK_FLEX[this.justify()] ?? 'flex-start');
}
