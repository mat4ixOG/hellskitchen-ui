import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  ElementRef,
  afterRenderEffect,
  computed,
  inject,
  input,
  model,
  signal,
  viewChild
} from '@angular/core';

export type HkPopoverSide = 'top' | 'right' | 'bottom' | 'left';
export type HkPopoverAlign = 'start' | 'center' | 'end';
/** `side`, or `side-alignment` when the alignment is not centred. */
export type HkPopoverPlacement = HkPopoverSide | `${HkPopoverSide}-${'start' | 'end'}`;

const HK_POPOVER_OPPOSITE: Record<HkPopoverSide, HkPopoverSide> = {
  top: 'bottom',
  bottom: 'top',
  left: 'right',
  right: 'left'
};

/** Keeps the panel this far from the viewport edge when shifting. */
const HK_POPOVER_EDGE = 8;

let nextPopoverId = 0;

/**
 * Anchored panel with a placement you choose, a flip when it will not fit, and
 * a shift along its edge to stay on screen.
 *
 * Placement is one string — side plus optional alignment — and both the panel
 * and its arrow derive from it, so they can never disagree.
 */
@Component({
  selector: 'hk-popover',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './hk-popover.component.html',
  styleUrl: './hk-popover.component.css',
  host: {
    '(mouseenter)': 'trigger() === "hover" && open.set(true)',
    '(mouseleave)': 'trigger() === "hover" && open.set(false)',
    '(keydown.escape)': 'onEscape()'
  }
})
export class HkPopoverComponent {
  readonly placement = input<HkPopoverPlacement>('bottom');
  readonly flip = input(true);
  readonly shift = input(true);
  readonly trigger = input<'click' | 'hover'>('click');
  /** Gap between trigger and panel, in px. */
  readonly offset = input(8);
  readonly arrow = input(true);
  /** Visibility. Two-way bindable; `openChange` emits on open and close. */
  readonly open = model(false);

  readonly panelId = `hk-popover-${nextPopoverId++}`;

  readonly side = computed(() => this.placement().split('-')[0] as HkPopoverSide);
  readonly align = computed(
    () => (this.placement().split('-')[1] as HkPopoverAlign | undefined) ?? 'center'
  );

  private readonly flipped = signal(false);
  private readonly shiftBy = signal(0);

  /** The side actually used — the opposite one when it flipped. */
  readonly resolvedSide = computed(() =>
    this.flipped() ? HK_POPOVER_OPPOSITE[this.side()] : this.side()
  );
  readonly shiftX = computed(() => (this.isVertical() ? this.shiftBy() : 0));
  readonly shiftY = computed(() => (this.isVertical() ? 0 : this.shiftBy()));
  private readonly isVertical = computed(() => {
    const side = this.resolvedSide();
    return side === 'top' || side === 'bottom';
  });

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly panel = viewChild<ElementRef<HTMLElement>>('panel');
  /** Set by `hkPopoverTrigger`, so Escape can hand focus back to it. */
  triggerElement: HTMLElement | null = null;

  constructor() {
    // Browser only. The panel's size does not depend on its side, so the
    // measurement settles in one pass rather than flipping back and forth.
    afterRenderEffect(() => {
      const panel = this.panel()?.nativeElement;
      const side = this.side();
      const align = this.align();
      const offset = this.offset();
      const canFlip = this.flip();
      const canShift = this.shift();
      if (!this.open() || !panel) return;

      const anchor = this.host.nativeElement.getBoundingClientRect();
      const width = panel.offsetWidth;
      const height = panel.offsetHeight;
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      const room: Record<HkPopoverSide, number> = {
        top: anchor.top - offset,
        bottom: vh - anchor.bottom - offset,
        left: anchor.left - offset,
        right: vw - anchor.right - offset
      };
      const need = side === 'top' || side === 'bottom' ? height : width;
      const flipped = canFlip && room[side] < need && room[HK_POPOVER_OPPOSITE[side]] >= need;
      this.flipped.set(flipped);

      let shift = 0;
      if (canShift) {
        const vertical = side === 'top' || side === 'bottom';
        const [lo, hi, size, limit] = vertical
          ? [anchor.left, anchor.right, width, vw]
          : [anchor.top, anchor.bottom, height, vh];
        const start = align === 'start' ? lo : align === 'end' ? hi - size : (lo + hi) / 2 - size / 2;
        if (start < HK_POPOVER_EDGE) shift = HK_POPOVER_EDGE - start;
        else if (start + size > limit - HK_POPOVER_EDGE) shift = limit - HK_POPOVER_EDGE - (start + size);
      }
      this.shiftBy.set(shift);
    });
  }

  toggle(): void {
    this.open.set(!this.open());
  }

  onEscape(): void {
    if (!this.open()) return;
    this.open.set(false);
    this.triggerElement?.focus();
  }
}

/** The element that opens the popover. */
@Directive({
  selector: '[hkPopoverTrigger]',
  standalone: true,
  host: {
    'aria-haspopup': 'dialog',
    '[attr.aria-expanded]': 'popover?.open() ?? null',
    '[attr.aria-controls]': 'popover?.open() ? popover.panelId : null',
    '(click)': 'popover?.trigger() === "click" && popover.toggle()'
  }
})
export class HkPopoverTriggerDirective {
  protected readonly popover = inject(HkPopoverComponent, { optional: true });

  constructor() {
    if (this.popover) this.popover.triggerElement = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  }
}
