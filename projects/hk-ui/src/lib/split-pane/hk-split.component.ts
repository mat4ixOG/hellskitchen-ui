import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  Directive,
  ElementRef,
  computed,
  contentChildren,
  forwardRef,
  inject,
  input,
  model,
  signal
} from '@angular/core';

export type HkSplitOrientation = 'horizontal' | 'vertical';

/**
 * One of the two panes of an `hk-split`. The first sized pane takes the split
 * percentage; the second takes the rest.
 */
@Directive({
  selector: '[hkPane]',
  standalone: true,
  host: {
    class: 'hk-pane',
    '[style.order]': 'index() === 0 ? 0 : 2',
    '[style.flex]': 'index() === 0 ? "0 0 " + parent.split() + "%" : "1 1 0%"',
    '[style.min-width]': '"0"',
    '[style.min-height]': '"0"',
    '[style.overflow]': '"hidden"'
  }
})
export class HkPaneDirective {
  protected readonly parent = inject(forwardRef(() => HkSplitComponent));
  readonly index = computed(() => this.parent.panes().indexOf(this));
}

/**
 * A draggable splitter with keyboard resize and real minimum sizes, so neither
 * pane can be collapsed into uselessness by accident.
 */
@Component({
  selector: 'hk-split',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'hk-split',
    '[attr.data-orientation]': 'orientation()',
    '[class.is-dragging]': 'dragging()'
  },
  template: `
    <ng-content select="[hkPane]" />
    <div class="hk-split-handle" role="separator" tabindex="0"
      [attr.aria-orientation]="orientation() === 'horizontal' ? 'vertical' : 'horizontal'"
      [attr.aria-valuenow]="split()"
      [attr.aria-valuemin]="min()"
      [attr.aria-valuemax]="max()"
      (pointerdown)="start($event)"
      (keydown)="onKey($event)"></div>
  `,
  styles: `
    @layer components {
      :host {
        --hk-split-rest: var(--hk-split-handle, #f1f5f9);
        display: flex;
        overflow: hidden;
      }
      :host-context(.dark) { --hk-split-rest: var(--hk-split-handle, rgb(255 255 255 / 0.06)); }
      :host([data-orientation='vertical']) { flex-direction: column; }

      .hk-split-handle {
        order: 1;
        flex-shrink: 0;
        width: 0.375rem;
        cursor: col-resize;
        background: var(--hk-split-rest);
        touch-action: none;
        transition: background-color 150ms ease;
      }
      :host([data-orientation='vertical']) .hk-split-handle {
        width: auto;
        height: 0.375rem;
        cursor: row-resize;
      }
      .hk-split-handle:hover {
        background: rgb(185 28 28 / 0.6);
      }
      .hk-split-handle:focus-visible,
      :host(.is-dragging) .hk-split-handle {
        outline: none;
        background: var(--hk-split-handle-active, #dc2626);
      }
      :host(.is-dragging) { user-select: none; }
    }
  `
})
export class HkSplitComponent {
  /** First pane size as a percentage. Two-way bindable; emits `splitChange`. */
  readonly split = model(50);
  readonly min = input(10);
  readonly max = input(90);
  readonly orientation = input<HkSplitOrientation>('horizontal');
  /** Percentage moved per arrow-key press. */
  readonly step = input(4);

  readonly panes = contentChildren(HkPaneDirective);
  readonly dragging = signal(false);

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private restore: number | null = null;
  private release: (() => void) | null = null;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.release?.());
  }

  private clamp(value: number): number {
    return Math.min(this.max(), Math.max(this.min(), Math.round(value)));
  }

  private set(value: number): void {
    const next = this.clamp(value);
    if (next !== this.split()) this.split.set(next);
  }

  start(event: PointerEvent): void {
    if (event.button !== 0) return;
    event.preventDefault();
    const rect = this.host.nativeElement.getBoundingClientRect();
    const vertical = this.orientation() === 'vertical';
    this.dragging.set(true);

    const move = (moveEvent: PointerEvent): void => {
      const percent = vertical
        ? ((moveEvent.clientY - rect.top) / rect.height) * 100
        : ((moveEvent.clientX - rect.left) / rect.width) * 100;
      this.set(percent);
    };
    const stop = (): void => this.release?.();

    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', stop);
    this.release = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', stop);
      this.dragging.set(false);
      this.release = null;
    };
  }

  onKey(event: KeyboardEvent): void {
    const vertical = this.orientation() === 'vertical';
    const back = vertical ? 'ArrowUp' : 'ArrowLeft';
    const forward = vertical ? 'ArrowDown' : 'ArrowRight';

    if (event.key === back) this.set(this.split() - this.step());
    else if (event.key === forward) this.set(this.split() + this.step());
    else if (event.key === 'Home') this.set(this.min());
    else if (event.key === 'End') this.set(this.max());
    else if (event.key === 'Enter') {
      // Collapse to the minimum, and a second Enter brings the pane back.
      if (this.restore !== null && this.split() === this.min()) {
        this.set(this.restore);
        this.restore = null;
      } else {
        this.restore = this.split();
        this.set(this.min());
      }
    } else return;
    event.preventDefault();
  }
}
