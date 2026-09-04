import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild
} from '@angular/core';
import {
  HkFilterMeta,
  HkFilterType,
  HkMatchMode,
  HkSelectOption
} from './table.types';
import { MATCH_MODES, MATCH_MODE_LABELS, defaultMatchMode, isFilterInactive } from './table.utils';

/**
 * Per-column filter: a funnel button plus the panel it opens.
 *
 * The panel is `position: fixed` and positioned from the trigger's rect, so a
 * scrolling table body can never clip it and no portal/CDK overlay is needed.
 */
@Component({
  selector: 'hk-table-filter',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button #trigger type="button" class="hk-filter-btn" [class.is-active]="active()"
      [attr.aria-label]="'Filter ' + label()" [attr.aria-expanded]="open()"
      (click)="toggle($event)">
      <svg viewBox="0 0 16 16" aria-hidden="true" width="12" height="12">
        <path d="M1.5 3h13L9.5 8.6V14L6.5 12V8.6L1.5 3Z" fill="currentColor" />
      </svg>
    </button>

    @if (open()) {
      <div class="hk-filter-panel" role="dialog" [attr.aria-label]="label() + ' filter'"
        [style.top.px]="position().top" [style.left.px]="position().left"
        (keydown.escape)="close()">

        <div class="hk-filter-head">
          <span class="hk-filter-title">{{ label() }}</span>
          <button type="button" class="hk-filter-x" (click)="close()" aria-label="Close">×</button>
        </div>

        @if (modes().length > 1) {
          <select class="hk-filter-mode" [value]="draftMode()"
            (change)="draftMode.set($any($event.target).value)" aria-label="Match mode">
            @for (mode of modes(); track mode) {
              <option [value]="mode">{{ modeLabel(mode) }}</option>
            }
          </select>
        }

        @switch (type()) {
          @case ('multiselect') {
            <input class="hk-filter-input" type="search" placeholder="Search values"
              [value]="optionQuery()" (input)="optionQuery.set($any($event.target).value)"
              aria-label="Search filter values" />
            <div class="hk-filter-actions">
              <button type="button" (click)="selectAllVisible()">Select all</button>
              <button type="button" (click)="draftList.set([])">Clear</button>
            </div>
            <div class="hk-filter-list" role="group">
              @for (option of visibleOptions(); track option.label) {
                <label class="hk-filter-option">
                  <input type="checkbox" [checked]="isPicked(option.value)"
                    (change)="togglePick(option.value)" />
                  <span>{{ option.label }}</span>
                </label>
              } @empty {
                <p class="hk-filter-none">No values</p>
              }
            </div>
          }
          @case ('select') {
            <select class="hk-filter-input" [value]="asText(draftValue())"
              (change)="draftValue.set($any($event.target).value)" aria-label="Value">
              <option value="">Any</option>
              @for (option of visibleOptions(); track option.label) {
                <option [value]="asText(option.value)">{{ option.label }}</option>
              }
            </select>
          }
          @case ('boolean') {
            <select class="hk-filter-input" [value]="asText(draftValue())"
              (change)="draftValue.set($any($event.target).value)" aria-label="Value">
              <option value="">Any</option>
              <option value="true">{{ trueLabel() }}</option>
              <option value="false">{{ falseLabel() }}</option>
            </select>
          }
          @default {
            @if (!needsValue()) {
              <p class="hk-filter-none">No value needed for this mode.</p>
            } @else {
              <input class="hk-filter-input" [type]="inputType()" [placeholder]="placeholder()"
                [value]="asText(draftValue())" (input)="draftValue.set($any($event.target).value)"
                (keydown.enter)="apply()" aria-label="Value" />
              @if (draftMode() === 'between') {
                <input class="hk-filter-input" [type]="inputType()" placeholder="and"
                  [value]="asText(draftValue2())" (input)="draftValue2.set($any($event.target).value)"
                  (keydown.enter)="apply()" aria-label="Second value" />
              }
            }
          }
        }

        <div class="hk-filter-foot">
          <button type="button" class="hk-filter-clear" (click)="clear()">Clear</button>
          <button type="button" class="hk-filter-apply" (click)="apply()">Apply</button>
        </div>
      </div>
      <div class="hk-filter-scrim" (click)="close()" aria-hidden="true"></div>
    }
  `,
  styles: [`
    :host { display: inline-flex; position: relative; }
    .hk-filter-btn {
      display: inline-flex; align-items: center; justify-content: center;
      width: 1.25rem; height: 1.25rem; padding: 0; border: none; cursor: pointer;
      border-radius: calc(var(--hk-table-radius) / 3);
      background: transparent; color: var(--hk-table-muted);
      transition: color var(--hk-table-motion, 160ms), background var(--hk-table-motion, 160ms);
    }
    .hk-filter-btn:hover { background: var(--hk-table-row-hover); color: var(--hk-table-text); }
    .hk-filter-btn.is-active { color: var(--hk-table-accent); }
    .hk-filter-btn:focus-visible { outline: 2px solid var(--hk-table-accent); outline-offset: 1px; }
    .hk-filter-scrim { position: fixed; inset: 0; z-index: 998; }
    .hk-filter-panel {
      position: fixed; z-index: 999; width: 15rem;
      display: flex; flex-direction: column; gap: .4rem; padding: .6rem;
      background: var(--hk-table-panel-bg); color: var(--hk-table-text);
      border: 1px solid var(--hk-table-border); border-radius: var(--hk-table-radius);
      box-shadow: var(--hk-table-panel-shadow, 0 18px 40px rgb(0 0 0 / .55));
      font-size: var(--hk-table-font-sm, .8rem); font-weight: 400; text-align: left;
      color-scheme: var(--hk-table-scheme, light);
    }
    .hk-filter-head { display: flex; align-items: center; justify-content: space-between; }
    .hk-filter-title { font-weight: 600; }
    .hk-filter-x {
      border: none; background: transparent; color: var(--hk-table-muted);
      cursor: pointer; font-size: 1rem; line-height: 1; padding: 0 .15rem;
    }
    .hk-filter-input, .hk-filter-mode {
      width: 100%; appearance: none; font: inherit; padding: .35rem .45rem;
      background: var(--hk-table-control-bg, var(--hk-table-input-bg));
      color: var(--hk-table-text);
      border: 1px solid var(--hk-table-border); border-radius: calc(var(--hk-table-radius) / 2);
    }
    /* The dropdown popup is browser-drawn: it needs an opaque colour of its
       own, or it inherits the platform default and renders white on white. */
    .hk-filter-mode option, .hk-filter-input option {
      background-color: var(--hk-table-control-bg, #fff);
      color: var(--hk-table-text);
    }
    .hk-filter-input:focus-visible, .hk-filter-mode:focus-visible {
      outline: 2px solid var(--hk-table-accent); outline-offset: -1px;
    }
    .hk-filter-actions { display: flex; gap: .35rem; }
    .hk-filter-actions button {
      flex: 1; padding: .2rem; cursor: pointer; font: inherit;
      background: transparent; color: var(--hk-table-accent);
      border: 1px solid var(--hk-table-border); border-radius: calc(var(--hk-table-radius) / 2);
    }
    .hk-filter-list { max-height: 11rem; overflow: auto; display: flex; flex-direction: column; }
    .hk-filter-option {
      display: flex; align-items: center; gap: .45rem; padding: .25rem .2rem;
      border-radius: calc(var(--hk-table-radius) / 3); cursor: pointer;
    }
    .hk-filter-option:hover { background: var(--hk-table-row-hover); }
    .hk-filter-option span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .hk-filter-option input { accent-color: var(--hk-table-accent); }
    .hk-filter-none { margin: 0; color: var(--hk-table-muted); }
    .hk-filter-foot { display: flex; gap: .35rem; margin-top: .15rem; }
    .hk-filter-foot button {
      flex: 1; padding: .3rem; cursor: pointer; font: inherit; font-weight: 600;
      border-radius: calc(var(--hk-table-radius) / 2); border: 1px solid var(--hk-table-border);
    }
    .hk-filter-clear { background: transparent; color: var(--hk-table-muted); }
    .hk-filter-apply {
      background: var(--hk-table-accent); border-color: var(--hk-table-accent);
      color: var(--hk-table-accent-contrast, #fff);
    }
  `]
})
export class HkTableFilterComponent {
  readonly label = input('');
  readonly type = input<HkFilterType>('text');
  readonly options = input<HkSelectOption[]>([]);
  readonly meta = input<HkFilterMeta | undefined>(undefined);
  readonly placeholder = input('Value');
  readonly trueLabel = input('Yes');
  readonly falseLabel = input('No');

  readonly filterChange = output<HkFilterMeta | null>();

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly trigger = viewChild<ElementRef<HTMLButtonElement>>('trigger');

  readonly open = signal(false);
  readonly position = signal({ top: 0, left: 0 });
  readonly optionQuery = signal('');

  readonly draftMode = signal<HkMatchMode>('contains');
  readonly draftValue = signal<unknown>(null);
  readonly draftValue2 = signal<unknown>(null);
  readonly draftList = signal<unknown[]>([]);

  readonly modes = computed(() => MATCH_MODES[this.type()] ?? []);
  readonly active = computed(() => !isFilterInactive(this.meta()));

  readonly needsValue = computed(
    () => this.draftMode() !== 'empty' && this.draftMode() !== 'notEmpty'
  );

  readonly inputType = computed(() => {
    if (this.type() === 'number') return 'number';
    if (this.type() === 'date') return 'date';
    return 'text';
  });

  readonly visibleOptions = computed(() => {
    const query = this.optionQuery().trim().toLowerCase();
    const all = this.options();
    return query ? all.filter((option) => option.label.toLowerCase().includes(query)) : all;
  });

  constructor() {
    // Whenever the panel opens, seed the draft from the committed filter so
    // cancelling (clicking away) leaves the applied state untouched.
    effect(() => {
      if (!this.open()) return;
      const meta = this.meta();
      this.draftMode.set(meta?.matchMode ?? defaultMatchMode(this.type()));
      if (this.type() === 'multiselect') {
        this.draftList.set(Array.isArray(meta?.value) ? [...(meta!.value as unknown[])] : []);
      } else {
        this.draftValue.set(meta?.value ?? null);
        this.draftValue2.set(meta?.value2 ?? null);
      }
    });
  }

  modeLabel(mode: HkMatchMode): string {
    return MATCH_MODE_LABELS[mode] ?? mode;
  }

  asText(value: unknown): string {
    return value == null ? '' : String(value);
  }

  isPicked(value: unknown): boolean {
    return this.draftList().some((item) => String(item) === String(value));
  }

  togglePick(value: unknown): void {
    const list = this.draftList();
    this.draftList.set(
      this.isPicked(value) ? list.filter((item) => String(item) !== String(value)) : [...list, value]
    );
  }

  selectAllVisible(): void {
    const merged = [...this.draftList()];
    for (const option of this.visibleOptions()) {
      if (!merged.some((item) => String(item) === String(option.value))) merged.push(option.value);
    }
    this.draftList.set(merged);
  }

  toggle(event: MouseEvent): void {
    event.stopPropagation();
    if (this.open()) {
      this.close();
      return;
    }
    this.optionQuery.set('');
    this.place();
    this.open.set(true);
  }

  close(): void {
    this.open.set(false);
  }

  apply(): void {
    const mode = this.draftMode();
    if (this.type() === 'multiselect') {
      const list = this.draftList();
      this.emit(list.length ? { value: list, matchMode: 'in' } : null);
      return;
    }
    if (mode === 'empty' || mode === 'notEmpty') {
      this.emit({ value: true, matchMode: mode });
      return;
    }
    const value = this.normalise(this.draftValue());
    const value2 = this.normalise(this.draftValue2());
    const empty = value == null && value2 == null;
    this.emit(empty ? null : { value, value2, matchMode: mode });
  }

  clear(): void {
    this.draftValue.set(null);
    this.draftValue2.set(null);
    this.draftList.set([]);
    this.emit(null);
  }

  private emit(meta: HkFilterMeta | null): void {
    this.filterChange.emit(meta);
    this.close();
  }

  /** '' from a cleared input means "no filter", not "match empty string". */
  private normalise(value: unknown): unknown {
    if (value === '' || value === undefined) return null;
    if (this.type() === 'number' && typeof value === 'string') {
      const parsed = Number(value);
      return Number.isNaN(parsed) ? null : parsed;
    }
    return value;
  }

  /** Anchors the panel under the trigger, flipping when it would overflow. */
  private place(): void {
    const rect = (this.trigger()?.nativeElement ?? this.host.nativeElement).getBoundingClientRect();
    const width = 240;
    const height = this.type() === 'multiselect' ? 340 : 190;
    let left = rect.left;
    let top = rect.bottom + 6;
    if (left + width > window.innerWidth - 8) left = Math.max(8, window.innerWidth - width - 8);
    if (top + height > window.innerHeight - 8) top = Math.max(8, rect.top - height - 6);
    this.position.set({ top, left });
  }
}
