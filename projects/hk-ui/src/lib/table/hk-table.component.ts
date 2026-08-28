import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  NgZone,
  OnInit,
  computed,
  contentChildren,
  effect,
  inject,
  input,
  model,
  output,
  signal,
  untracked,
  viewChild
} from '@angular/core';
import { HkTableFilterComponent } from './hk-table-filter.component';
import { HkTablePaginatorComponent } from './hk-table-paginator.component';
import { HkTemplate } from './hk-table-template.directive';
import {
  HkCellContext,
  HkColumn,
  HkEditEvent,
  HkFilterMeta,
  HkFilterState,
  HkFilterType,
  HkLeafColumn,
  HkPageEvent,
  HkRenderRow,
  HkRowGroupMode,
  HkSelectOption,
  HkSelectionMode,
  HkSortMeta,
  HkSortOrder,
  HkTableLazyEvent,
  HkTableSize,
  HkTableState
} from './table.types';
import {
  aggregate,
  applyColumnState,
  buildHeaderRows,
  compileFilter,
  defaultCompare,
  deriveOptions,
  flattenLeaves,
  formatNumber,
  isBlank,
  isFilterInactive,
  normaliseOptions,
  resolveField,
  searchText,
  toCsv,
  toNumber
} from './table.utils';

/** Ids used by the grid's own leading/trailing cells. */
const CELL_EXPANDER = '__expander';
const CELL_SELECT = '__select';
const CELL_INDEX = '__index';
const CELL_EDIT = '__edit';

/**
 * `<hk-table>` — the data grid.
 *
 * One component covers the whole spread: hierarchical headers, per-column and
 * global filtering, single or multi-column sort, client or server paging,
 * selection, row expansion, row grouping, frozen columns, resize, reorder,
 * column visibility, inline editing, footer aggregates, virtual scrolling,
 * CSV export and persisted state.
 *
 * Everything visual is a CSS variable (`--hk-table-*`) and everything
 * structural is a named `[hkTemplate]`, so it can be restyled or rebuilt
 * without forking it.
 */
@Component({
  selector: 'hk-table',
  standalone: true,
  imports: [NgTemplateOutlet, HkTablePaginatorComponent, HkTableFilterComponent],
  templateUrl: './hk-table.component.html',
  styleUrl: './hk-table.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'hk-table-host' }
})
export class HkTableComponent<T extends Record<string, any> = any> implements OnInit {
  // ── Data ─────────────────────────────────────────────────────
  /** Rows to render. When `lazy`, this is the current page only. */
  readonly value = input<T[]>([]);
  /** Column tree. Nest `children` for grouped headers. */
  readonly columns = input<HkColumn<T>[]>([]);
  /** Unique row field. Required for stable selection, expansion and editing. */
  readonly dataKey = input('');
  readonly loading = input(false);
  /** Hands sorting, filtering and paging to the server via `lazyLoad`. */
  readonly lazy = input(false);
  /** Server-side row count. Ignored unless `lazy`. */
  readonly totalRecords = input<number | null>(null);

  // ── Paging ───────────────────────────────────────────────────
  readonly paginator = input(false);
  readonly first = model(0);
  readonly rows = model(10);
  readonly rowsPerPageOptions = input<number[]>([10, 25, 50, 100]);
  readonly showPageJump = input(false);

  // ── Sorting ──────────────────────────────────────────────────
  readonly sortMode = input<'single' | 'multiple'>('single');
  /** Initial sort field. Use `sort` for full control. */
  readonly sortField = input('');
  readonly sortOrder = input<HkSortOrder>(1);
  /** Active sort stack, outermost first. Two-way bindable. */
  readonly sort = model<HkSortMeta[]>([]);

  // ── Filtering ────────────────────────────────────────────────
  readonly filters = model<HkFilterState>({});
  readonly globalFilter = model('');
  /** Fields the search box looks at. Defaults to every visible leaf. */
  readonly globalFilterFields = input<string[]>([]);
  readonly showSearch = input(false);
  readonly searchPlaceholder = input('Search');
  /** Debounce on the search box, in ms. */
  readonly searchDelay = input(200);

  // ── Selection ────────────────────────────────────────────────
  readonly selectionMode = input<HkSelectionMode>(null);
  /** Always an array, even in single mode — one less shape to branch on. */
  readonly selection = model<T[]>([]);
  /** Ctrl/Cmd-click to add in `multiple` mode instead of replacing. */
  readonly metaKeySelection = input(true);

  // ── Expansion ────────────────────────────────────────────────
  readonly rowExpansion = input(false);
  readonly expandedKeys = model<Record<string, boolean>>({});
  readonly expandMode = input<'single' | 'multiple'>('multiple');

  // ── Grouping ─────────────────────────────────────────────────
  readonly groupRowsBy = input('');
  readonly rowGroupMode = input<HkRowGroupMode>('subheader');
  readonly collapsibleGroups = input(true);
  readonly showGroupFooter = input(false);

  // ── Layout / scrolling ───────────────────────────────────────
  readonly scrollable = input(true);
  readonly scrollHeight = input('');
  readonly stickyHeader = input(true);
  readonly virtualScroll = input(false);
  readonly virtualRowHeight = input(36);
  readonly virtualBuffer = input(6);

  // ── Column behaviour ─────────────────────────────────────────
  readonly resizableColumns = input(false);
  readonly reorderableColumns = input(false);
  readonly columnToggle = input(false);

  // ── Editing ──────────────────────────────────────────────────
  readonly editMode = input<'cell' | 'row' | null>(null);

  // ── Chrome ───────────────────────────────────────────────────
  readonly size = input<HkTableSize>('md');
  readonly striped = input(false);
  readonly gridlines = input(true);
  readonly hover = input(true);
  readonly showIndex = input(false);
  readonly indexHeader = input('#');
  readonly caption = input('');
  readonly emptyMessage = input('No records found');
  readonly emptyCellValue = input('—');
  readonly numberLocale = input('en-US');
  readonly styleClass = input('');
  readonly showExport = input(false);
  readonly exportFilename = input('table');
  /** Force the aggregate footer on or off. Auto-detected when null. */
  readonly showFooter = input<boolean | null>(null);
  readonly rowClass = input<string | ((row: T, index: number) => string)>('');
  readonly keyboardNavigation = input(true);

  // ── State persistence ────────────────────────────────────────
  /** Set to persist sort, filters, page, widths, order and visibility. */
  readonly stateKey = input('');
  readonly stateStorage = input<'local' | 'session'>('local');

  // ── Outputs ──────────────────────────────────────────────────
  readonly lazyLoad = output<HkTableLazyEvent>();
  readonly pageChange = output<HkPageEvent>();
  readonly sortChange = output<HkSortMeta[]>();
  readonly rowSelect = output<{ row: T; index: number }>();
  readonly rowUnselect = output<{ row: T; index: number }>();
  readonly rowExpand = output<{ row: T; key: string }>();
  readonly rowCollapse = output<{ row: T; key: string }>();
  readonly rowClick = output<{ row: T; index: number; originalEvent: MouseEvent }>();
  readonly cellClick = output<{ row: T; column: HkColumn<T>; value: unknown; index: number }>();
  readonly editComplete = output<HkEditEvent<T>>();
  readonly editCancel = output<HkEditEvent<T>>();
  readonly columnResize = output<{ column: HkColumn<T>; width: number }>();
  readonly columnReorder = output<{ order: string[] }>();
  readonly columnVisibility = output<{ hidden: string[] }>();

  // ── Content templates ────────────────────────────────────────
  private readonly templateDirectives = contentChildren(HkTemplate, { descendants: true });
  readonly templates = computed(() => {
    const map: Record<string, HkTemplate['template']> = {};
    for (const directive of this.templateDirectives()) map[directive.name] = directive.template;
    return map;
  });

  private readonly scroller = viewChild<ElementRef<HTMLElement>>('scroller');
  private readonly tableEl = viewChild<ElementRef<HTMLTableElement>>('tableEl');

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly zone = inject(NgZone);

  // ── Internal state ───────────────────────────────────────────
  private readonly hidden = signal<ReadonlySet<string>>(new Set<string>());
  private readonly widths = signal<Record<string, string>>({});
  private readonly order = signal<string[] | null>(null);
  private readonly dataVersion = signal(0);
  private readonly collapsedGroups = signal<ReadonlySet<string>>(new Set<string>());
  private readonly rowDrafts = new Map<string, Partial<T>>();

  readonly layoutFixed = signal(false);
  readonly togglePanelOpen = signal(false);
  readonly editingCell = signal<{ key: string; field: string } | null>(null);
  readonly editingRows = signal<ReadonlySet<string>>(new Set<string>());
  readonly focusedCell = signal<{ row: number; col: number } | null>(null);
  readonly scrollTop = signal(0);
  readonly viewportHeight = signal(0);
  readonly frozenLeftOffsets = signal<Record<string, number>>({});
  readonly frozenRightOffsets = signal<Record<string, number>>({});
  readonly headerRowOffsets = signal<number[]>([]);

  private searchTimer: ReturnType<typeof setTimeout> | null = null;
  private resizeState: {
    id: string;
    startX: number;
    startWidth: number;
    column: HkColumn<T>;
  } | null = null;
  private dragColumnKey: string | null = null;
  private measureScheduled = false;
  private resizeFrame: number | null = null;
  private pendingResizeX = 0;

  // ── Column derivation ────────────────────────────────────────
  readonly effectiveColumns = computed(() =>
    applyColumnState(this.columns(), this.hidden(), this.widths(), this.order())
  );
  readonly leaves = computed(() => flattenLeaves(this.effectiveColumns()));
  readonly headerRows = computed(() => buildHeaderRows(this.effectiveColumns(), this.leaves()));
  readonly headerDepth = computed(() => this.headerRows().length);

  /** Every leaf in declaration order, for the visibility menu. */
  readonly toggleableColumns = computed(() => {
    const out: { id: string; label: string; hidden: boolean }[] = [];
    const walk = (nodes: HkColumn<T>[], path: string[], trail: string[]) => {
      for (const node of nodes ?? []) {
        const nextPath = [...path, node.key];
        if (node.children?.length) {
          walk(node.children, nextPath, [...trail, node.header ?? node.key]);
        } else if (node.toggleable !== false) {
          const id = nextPath.join('.');
          out.push({
            id,
            label: [...trail, node.header ?? node.key].join(' › '),
            hidden: this.hidden().has(id) || !!node.hidden
          });
        }
      }
    };
    walk(this.columns(), [], []);
    return out;
  });

  readonly hasFrozenLeft = computed(() =>
    this.leaves().some((leaf) => leaf.column.frozen === 'left')
  );
  readonly hasFrozenRight = computed(() =>
    this.leaves().some((leaf) => leaf.column.frozen === 'right')
  );

  /** Leading control cells, in render order. */
  readonly leadingCells = computed(() => {
    const cells: string[] = [];
    if (this.rowExpansion()) cells.push(CELL_EXPANDER);
    if (this.selectionMode() === 'checkbox') cells.push(CELL_SELECT);
    if (this.showIndex()) cells.push(CELL_INDEX);
    return cells;
  });
  readonly hasEditColumn = computed(() => this.editMode() === 'row');

  /** Total rendered columns — the colspan an expansion or group row needs. */
  readonly totalColumns = computed(
    () => this.leadingCells().length + this.leaves().length + (this.hasEditColumn() ? 1 : 0)
  );

  readonly hasAggregates = computed(() => this.leaves().some((leaf) => leaf.column.aggregate));
  readonly footerVisible = computed(() => {
    const forced = this.showFooter();
    return forced === null ? this.hasAggregates() : forced;
  });

  readonly showToolbar = computed(
    () =>
      this.showSearch() ||
      this.showExport() ||
      this.columnToggle() ||
      !!this.templates()['toolbar']
  );

  // ── Data pipeline ────────────────────────────────────────────
  /** Filtered + sorted client-side data. Pass-through when `lazy`. */
  readonly processed = computed<T[]>(() => {
    this.dataVersion();
    const source = this.value() ?? [];
    if (this.lazy()) return source;
    return this.sortRows(this.filterRows(source));
  });

  /** Rows reordered so each group is contiguous. */
  readonly grouped = computed<T[]>(() => {
    const field = this.groupRowsBy();
    const data = this.processed();
    if (!field) return data;
    const buckets = new Map<string, T[]>();
    for (const row of data) {
      const key = String(resolveField(row, field) ?? '');
      const bucket = buckets.get(key);
      if (bucket) bucket.push(row);
      else buckets.set(key, [row]);
    }
    return [...buckets.values()].flat();
  });

  readonly recordCount = computed(() =>
    this.lazy() ? this.totalRecords() ?? this.value().length : this.grouped().length
  );

  /** The slice actually on screen before group rows are woven in. */
  readonly pageRows = computed<T[]>(() => {
    const data = this.grouped();
    if (this.lazy() || !this.paginator()) return data;
    const start = this.first();
    return data.slice(start, start + this.rows());
  });

  /** Offset of the current page within the whole result set. */
  readonly pageOffset = computed(() => (this.paginator() || this.lazy() ? this.first() : 0));

  /** Data rows plus group headers/footers — the full unwindowed render list. */
  readonly renderRows = computed<HkRenderRow<T>[]>(() => {
    const rowsOut: HkRenderRow<T>[] = [];
    const data = this.pageRows();
    const groupField = this.groupRowsBy();
    const offset = this.pageOffset();
    const mode = this.rowGroupMode();
    const collapsed = this.collapsedGroups();
    const wantsFooter = this.showGroupFooter();

    if (!groupField) {
      data.forEach((row, index) => {
        rowsOut.push({
          kind: 'data',
          row,
          dataIndex: offset + index,
          serial: offset + index + 1,
          key: this.keyOf(row, offset + index)
        });
      });
      return rowsOut;
    }

    // Walk the page in group runs so headers, spans and footers line up.
    let cursor = 0;
    while (cursor < data.length) {
      const groupValue = resolveField(data[cursor], groupField);
      const groupId = String(groupValue ?? '');
      let end = cursor;
      while (end < data.length && String(resolveField(data[end], groupField) ?? '') === groupId) end++;
      const groupRows = data.slice(cursor, end);
      const isCollapsed = collapsed.has(groupId);

      if (mode === 'subheader') {
        rowsOut.push({
          kind: 'groupHeader',
          row: groupRows[0],
          dataIndex: offset + cursor,
          serial: 0,
          key: `g:${groupId}`,
          groupValue,
          groupRows
        });
      }

      if (!isCollapsed) {
        groupRows.forEach((row, index) => {
          rowsOut.push({
            kind: 'data',
            row,
            dataIndex: offset + cursor + index,
            serial: offset + cursor + index + 1,
            key: this.keyOf(row, offset + cursor + index),
            groupValue,
            groupRows,
            groupSpan: groupRows.length,
            isGroupStart: index === 0
          });
        });

        if (wantsFooter) {
          rowsOut.push({
            kind: 'groupFooter',
            row: groupRows[0],
            dataIndex: offset + end,
            serial: 0,
            key: `gf:${groupId}`,
            groupValue,
            groupRows
          });
        }
      }

      cursor = end;
    }
    return rowsOut;
  });

  // ── Virtual scrolling ────────────────────────────────────────
  private readonly virtualWindow = computed(() => {
    const all = this.renderRows();
    if (!this.virtualScroll()) return { start: 0, end: all.length, padTop: 0, padBottom: 0 };
    const rowHeight = Math.max(12, this.virtualRowHeight());
    const height = this.viewportHeight() || 400;
    const buffer = Math.max(0, this.virtualBuffer());
    const start = Math.max(0, Math.floor(this.scrollTop() / rowHeight) - buffer);
    const visible = Math.ceil(height / rowHeight) + buffer * 2;
    const end = Math.min(all.length, start + visible);
    return {
      start,
      end,
      padTop: start * rowHeight,
      padBottom: Math.max(0, (all.length - end) * rowHeight)
    };
  });

  readonly visibleRows = computed(() => {
    const { start, end } = this.virtualWindow();
    const all = this.renderRows();
    return start === 0 && end === all.length ? all : all.slice(start, end);
  });
  readonly padTop = computed(() => this.virtualWindow().padTop);
  readonly padBottom = computed(() => this.virtualWindow().padBottom);

  // ── Footer aggregates ────────────────────────────────────────
  readonly footerValues = computed<Record<string, unknown>>(() => {
    if (!this.footerVisible()) return {};
    const rows = this.lazy() ? this.value() : this.processed();
    const out: Record<string, unknown> = {};
    for (const leaf of this.leaves()) {
      if (leaf.column.aggregate) out[leaf.id] = aggregate(rows, leaf.column, leaf.field);
    }
    return out;
  });

  /** Distinct values per filterable column, cached off the unfiltered data. */
  readonly filterOptionCache = computed<Record<string, HkSelectOption[]>>(() => {
    const out: Record<string, HkSelectOption[]> = {};
    const source = this.value() ?? [];
    for (const leaf of this.leaves()) {
      const type = leaf.column.filter;
      if (type !== 'select' && type !== 'multiselect') continue;
      out[leaf.id] = leaf.column.filterOptions
        ? normaliseOptions(leaf.column.filterOptions)
        : deriveOptions(source, leaf.field);
    }
    return out;
  });

  readonly activeFilterCount = computed(
    () => Object.values(this.filters()).filter((meta) => !isFilterInactive(meta)).length
  );

  readonly allPageSelected = computed(() => {
    const rows = this.pageRows();
    if (!rows.length) return false;
    return rows.every((row) => this.isSelected(row));
  });
  readonly somePageSelected = computed(
    () => !this.allPageSelected() && this.pageRows().some((row) => this.isSelected(row))
  );

  readonly rootClasses = computed(() =>
    [
      'hk-table-root',
      `hk-size-${this.size()}`,
      this.striped() ? 'is-striped' : '',
      this.gridlines() ? 'is-gridlines' : '',
      this.hover() ? 'is-hover' : '',
      this.scrollable() ? 'is-scrollable' : '',
      this.virtualScroll() ? 'is-virtual' : '',
      this.stickyHeader() ? 'is-sticky' : '',
      this.loading() ? 'is-loading' : '',
      this.styleClass()
    ]
      .filter(Boolean)
      .join(' ')
  );

  constructor() {
    this.restoreState();

    // Seed the sort stack from the convenience inputs, once, if not already set.
    effect(() => {
      const field = this.sortField();
      if (!field) return;
      untracked(() => {
        if (!this.sort().length) this.sort.set([{ field, order: this.sortOrder() }]);
      });
    });

    // Persist whatever the user has configured, whenever it moves.
    effect(() => {
      const snapshot: HkTableState = {
        first: this.first(),
        rows: this.rows(),
        sort: this.sort(),
        filters: this.filters(),
        globalFilter: this.globalFilter(),
        hidden: [...this.hidden()],
        widths: this.widths(),
        order: this.order() ?? undefined
      };
      untracked(() => this.saveState(snapshot));
    });

    // Geometry only shifts when the header, the widths or emptiness change —
    // deliberately NOT on scroll, which would thrash layout every frame.
    effect(() => {
      this.leaves();
      this.widths();
      this.layoutFixed();
      const empty = this.pageRows().length === 0;
      untracked(() => {
        void empty;
        this.scheduleMeasure();
      });
    });
  }

  ngOnInit(): void {
    if (this.lazy()) this.emitLazy('init');
    this.observeViewport();
    this.attachScroll();
  }

  // ── Templates ────────────────────────────────────────────────
  tpl(name: string): HkTemplate['template'] | undefined {
    return this.templates()[name];
  }

  cellTemplate(leaf: HkLeafColumn<T>): HkTemplate['template'] | undefined {
    const map = this.templates();
    return map[`cell:${leaf.column.cellTemplate ?? leaf.id}`] ?? map[`cell:${leaf.column.key}`];
  }

  headerTemplate(column: HkColumn<T>): HkTemplate['template'] | undefined {
    const map = this.templates();
    return map[`header:${column.headerTemplate ?? column.key}`];
  }

  footerTemplate(leaf: HkLeafColumn<T>): HkTemplate['template'] | undefined {
    const map = this.templates();
    return map[`footer:${leaf.column.footerTemplate ?? leaf.id}`] ?? map[`footer:${leaf.column.key}`];
  }

  editorTemplate(leaf: HkLeafColumn<T>): HkTemplate['template'] | undefined {
    const map = this.templates();
    return map[`editor:${leaf.column.editorTemplate ?? leaf.id}`] ?? map[`editor:${leaf.column.key}`];
  }

  cellContext(render: HkRenderRow<T>, leaf: HkLeafColumn<T>): HkCellContext<T> {
    const value = resolveField(render.row, leaf.field);
    return {
      $implicit: value,
      value,
      row: render.row,
      column: leaf.column,
      rowIndex: render.dataIndex,
      serial: render.serial,
      set: (next: unknown) => this.commitValue(render, leaf, next)
    };
  }

  // ── Row identity ─────────────────────────────────────────────
  keyOf(row: T, index: number): string {
    const key = this.dataKey();
    if (key) {
      const value = resolveField(row, key);
      if (value != null) return String(value);
    }
    return `#${index}`;
  }

  rowClasses(render: HkRenderRow<T>): string {
    const extra = this.rowClass();
    const custom = typeof extra === 'function' ? extra(render.row, render.dataIndex) : extra;
    return [
      'hk-row',
      this.isSelected(render.row) ? 'is-selected' : '',
      this.isExpanded(render) ? 'is-expanded' : '',
      this.editingRows().has(render.key) ? 'is-editing' : '',
      custom || ''
    ]
      .filter(Boolean)
      .join(' ');
  }

  // ── Cell rendering ───────────────────────────────────────────
  rawValue(render: HkRenderRow<T>, leaf: HkLeafColumn<T>): unknown {
    return resolveField(render.row, leaf.field);
  }

  formatCell(row: T, leaf: HkLeafColumn<T>): string {
    const column = leaf.column;
    const value = resolveField(row, leaf.field);
    if (column.format) return column.format(value, row);
    if (isBlank(value)) return column.emptyValue ?? this.emptyCellValue();

    if (column.numeric || typeof value === 'number') {
      const numeric = toNumber(value);
      if (numeric !== null) {
        return formatNumber(numeric, column.numberLocale ?? this.numberLocale(), column.digits);
      }
    }

    const text = String(value);
    const limit = column.truncate;
    return limit && text.length > limit ? `${text.slice(0, limit)}…` : text;
  }

  cellTitle(row: T, leaf: HkLeafColumn<T>): string | null {
    const value = resolveField(row, leaf.field);
    if (isBlank(value) || typeof value === 'object') return null;
    return String(value);
  }

  cellClasses(row: T, leaf: HkLeafColumn<T>): string {
    const column = leaf.column;
    const align = column.align ?? (column.numeric ? 'right' : 'left');
    const extra =
      typeof column.cellClass === 'function'
        ? column.cellClass(resolveField(row, leaf.field), row)
        : column.cellClass;
    return ['hk-cell', `hk-align-${align}`, extra || ''].filter(Boolean).join(' ');
  }

  headerAlign(column: HkColumn<T>): string {
    return column.align ?? (column.numeric ? 'right' : 'left');
  }

  formatAggregate(leaf: HkLeafColumn<T>): string {
    const value = this.footerValues()[leaf.id];
    if (value == null) return leaf.column.footer ?? '—';
    if (typeof value === 'number') {
      const digits = leaf.column.aggregate === 'avg' ? leaf.column.digits ?? 2 : leaf.column.digits;
      return formatNumber(value, leaf.column.numberLocale ?? this.numberLocale(), digits);
    }
    return String(value);
  }

  /** Aggregate for one group, used by the group footer row. */
  groupAggregate(render: HkRenderRow<T>, leaf: HkLeafColumn<T>): string {
    if (!leaf.column.aggregate) return '';
    const value = aggregate(render.groupRows ?? [], leaf.column, leaf.field);
    if (value == null) return '—';
    if (typeof value === 'number') {
      const digits = leaf.column.aggregate === 'avg' ? leaf.column.digits ?? 2 : leaf.column.digits;
      return formatNumber(value, leaf.column.numberLocale ?? this.numberLocale(), digits);
    }
    return String(value);
  }

  // ── Sorting ──────────────────────────────────────────────────
  sortStateOf(leaf: HkLeafColumn<T>): HkSortOrder {
    const field = leaf.column.sortField ?? leaf.field;
    return this.sort().find((meta) => meta.field === field)?.order ?? 0;
  }

  sortIndexOf(leaf: HkLeafColumn<T>): number {
    if (this.sortMode() !== 'multiple') return -1;
    const field = leaf.column.sortField ?? leaf.field;
    const index = this.sort().findIndex((meta) => meta.field === field);
    return this.sort().length > 1 ? index : -1;
  }

  ariaSort(leaf: HkLeafColumn<T>): string | null {
    if (!leaf.column.sortable) return null;
    const order = this.sortStateOf(leaf);
    if (order === 1) return 'ascending';
    if (order === -1) return 'descending';
    return 'none';
  }

  /** asc → desc → off, and in multi mode shift-click stacks fields. */
  toggleSort(leaf: HkLeafColumn<T>, event?: Event): void {
    if (!leaf.column.sortable) return;
    const field = leaf.column.sortField ?? leaf.field;
    // Shift-click stacks a second sort field; keyboard activation never does.
    const additive =
      this.sortMode() === 'multiple' && !!(event as MouseEvent | KeyboardEvent | undefined)?.shiftKey;
    const current = this.sort();
    const existing = current.find((meta) => meta.field === field);
    const nextOrder: HkSortOrder = existing ? (existing.order === 1 ? -1 : 0) : 1;

    let next: HkSortMeta[];
    if (additive) {
      next = current.filter((meta) => meta.field !== field);
      if (nextOrder !== 0) next.push({ field, order: nextOrder });
    } else {
      next = nextOrder === 0 ? [] : [{ field, order: nextOrder }];
    }

    this.sort.set(next);
    this.sortChange.emit(next);
    this.first.set(0);
    if (this.lazy()) this.emitLazy('sort');
  }

  private sortRows(data: T[]): T[] {
    const stack = this.sort();
    if (!stack.length) return data;
    const leaves = this.leaves();
    const columnFor = (field: string) =>
      leaves.find((leaf) => (leaf.column.sortField ?? leaf.field) === field)?.column;

    return [...data].sort((rowA, rowB) => {
      for (const meta of stack) {
        if (!meta.order) continue;
        const column = columnFor(meta.field);
        const valueA = resolveField(rowA, meta.field);
        const valueB = resolveField(rowB, meta.field);
        const result = column?.comparator
          ? column.comparator(valueA, valueB, rowA, rowB)
          : defaultCompare(valueA, valueB);
        if (result !== 0) return result * meta.order;
      }
      return 0;
    });
  }

  // ── Filtering ────────────────────────────────────────────────
  filterMetaOf(leaf: HkLeafColumn<T>): HkFilterMeta | undefined {
    return this.filters()[leaf.id];
  }

  filterTypeOf(leaf: HkLeafColumn<T>): HkFilterType {
    return leaf.column.filter ?? 'none';
  }

  filterOptionsOf(leaf: HkLeafColumn<T>): HkSelectOption[] {
    return this.filterOptionCache()[leaf.id] ?? [];
  }

  onColumnFilter(leaf: HkLeafColumn<T>, meta: HkFilterMeta | null): void {
    const next = { ...this.filters() };
    if (meta) next[leaf.id] = meta;
    else delete next[leaf.id];
    this.filters.set(next);
    this.first.set(0);
    if (this.lazy()) this.emitLazy('filter');
  }

  clearFilters(): void {
    this.filters.set({});
    this.globalFilter.set('');
    this.first.set(0);
    if (this.lazy()) this.emitLazy('filter');
  }

  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => {
      this.globalFilter.set(value);
      this.first.set(0);
      if (this.lazy()) this.emitLazy('filter');
    }, Math.max(0, this.searchDelay()));
  }

  /**
   * One pass over the data with pre-compiled predicates. Nothing inside the row
   * loop parses, lowercases or looks anything up — operands and the field list
   * are resolved before the loop starts.
   */
  private filterRows(data: T[]): T[] {
    const search = this.globalFilter().trim().toLowerCase();
    const active = Object.entries(this.filters()).filter(([, meta]) => !isFilterInactive(meta));
    if (!active.length && !search) return data;

    const leaves = this.leaves();
    const leafById = new Map(leaves.map((leaf) => [leaf.id, leaf]));

    const tests = active.map(([id, meta]) => {
      const leaf = leafById.get(id);
      const custom = leaf?.column.filterPredicate;
      const compiled = custom ? null : compileFilter(meta);
      return {
        field: leaf?.field ?? id,
        run: custom
          ? (value: unknown, row: T) => custom(value, meta.value, row)
          : (value: unknown) => compiled!(value)
      };
    });

    const searchFields = this.globalFilterFields().length
      ? this.globalFilterFields()
      : leaves.filter((leaf) => leaf.column.searchable !== false).map((leaf) => leaf.field);
    const fieldCount = searchFields.length;

    const out: T[] = [];
    outer: for (const row of data) {
      for (const test of tests) {
        if (!test.run(resolveField(row, test.field), row)) continue outer;
      }
      if (search) {
        for (let index = 0; index < fieldCount; index++) {
          if (searchText(resolveField(row, searchFields[index])).includes(search)) {
            out.push(row);
            continue outer;
          }
        }
        continue outer;
      }
      out.push(row);
    }
    return out;
  }

  // ── Paging ───────────────────────────────────────────────────
  onPage(event: { first: number; rows: number }): void {
    this.first.set(event.first);
    this.rows.set(event.rows);
    const rows = Math.max(1, event.rows);
    this.pageChange.emit({
      first: event.first,
      rows,
      page: Math.floor(event.first / rows),
      pageCount: Math.max(1, Math.ceil(this.recordCount() / rows)),
      totalRecords: this.recordCount()
    });
    if (this.lazy()) this.emitLazy('page');
    this.scroller()?.nativeElement.scrollTo({ top: 0 });
  }

  /** Re-asks the server for the current page. No-op when not lazy. */
  refresh(): void {
    if (this.lazy()) this.emitLazy('refresh');
    else this.dataVersion.update((version) => version + 1);
  }

  private emitLazy(trigger: HkTableLazyEvent['trigger']): void {
    this.lazyLoad.emit({
      first: this.first(),
      rows: this.rows(),
      sort: this.sort(),
      filters: this.filters(),
      globalFilter: this.globalFilter(),
      trigger
    });
  }

  // ── Selection ────────────────────────────────────────────────
  /**
   * Selection is hashed once per change. Scanning the selection array per row
   * is what turns a 5k-row grid with 500 rows selected into a slideshow.
   */
  private readonly selectedIndex = computed(() => {
    const key = this.dataKey();
    const set = new Set<unknown>();
    for (const row of this.selection() ?? []) set.add(key ? resolveField(row, key) : row);
    return set;
  });

  isSelected(row: T): boolean {
    const set = this.selectedIndex();
    if (!set.size) return false;
    const key = this.dataKey();
    return set.has(key ? resolveField(row, key) : row);
  }

  /**
   * Row and cell interaction is delegated from <tbody>, not bound per cell.
   * A 5k x 12 grid would otherwise register six figures' worth of listeners;
   * this registers two, and stays flat as the data grows.
   */
  onBodyClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const cell = target.closest<HTMLElement>('[data-cell]');
    if (!cell) return;
    const render = this.renderRowAt(this.cellRow(cell));
    if (!render) return;

    const action = target.closest<HTMLElement>('[data-act]')?.dataset['act'];
    if (action) {
      event.stopPropagation();
      if (action === 'expand') this.toggleExpansion(render);
      else if (action === 'select') this.toggleRowSelection(render, true);
      else if (action === 'group') this.toggleGroup(render);
      else if (action === 'edit-start') this.startRowEdit(render);
      else if (action === 'edit-save') this.saveRowEdit(render);
      else if (action === 'edit-cancel') this.cancelRowEdit(render);
      return;
    }

    if (render.kind !== 'data') return;
    const leaf = this.leafAtColumn(this.cellColumn(cell));
    if (leaf) {
      this.cellClick.emit({
        row: render.row,
        column: leaf.column,
        value: resolveField(render.row, leaf.field),
        index: render.dataIndex
      });
    }
    this.onRowClick(render, event);
  }

  onBodyDblClick(event: MouseEvent): void {
    if (this.editMode() !== 'cell') return;
    const cell = (event.target as HTMLElement).closest<HTMLElement>('[data-cell]');
    if (!cell) return;
    const render = this.renderRowAt(this.cellRow(cell));
    const leaf = this.leafAtColumn(this.cellColumn(cell));
    if (render?.kind === 'data' && leaf) this.startCellEdit(render, leaf);
  }

  private cellRow(cell: HTMLElement): number {
    return Number(cell.dataset['cell']?.split('-')[0] ?? -1);
  }

  private cellColumn(cell: HTMLElement): number {
    return Number(cell.dataset['cell']?.split('-')[1] ?? -1);
  }

  private renderRowAt(index: number): HkRenderRow<T> | null {
    return this.visibleRows()[index] ?? null;
  }

  private leafAtColumn(index: number): HkLeafColumn<T> | null {
    const offset = index - this.leadingCells().length;
    const leaves = this.leaves();
    return offset >= 0 && offset < leaves.length ? leaves[offset] : null;
  }

  onRowClick(render: HkRenderRow<T>, event: MouseEvent): void {
    this.rowClick.emit({ row: render.row, index: render.dataIndex, originalEvent: event });
    const mode = this.selectionMode();
    if (!mode || mode === 'checkbox') return;
    // Clicks inside an editor or a control must not flip the selection.
    if ((event.target as HTMLElement).closest('input,select,textarea,button,a')) return;
    this.toggleRowSelection(render, mode === 'multiple' && (!this.metaKeySelection() || event.ctrlKey || event.metaKey));
  }

  toggleRowSelection(render: HkRenderRow<T>, additive = false): void {
    const row = render.row;
    const selected = this.isSelected(row);
    const mode = this.selectionMode();
    let next: T[];

    if (selected) {
      next = additive || mode !== 'single' ? this.selection().filter((item) => !this.sameRow(item, row)) : [];
    } else if (mode === 'single') {
      next = [row];
    } else {
      next = additive || mode === 'checkbox' || mode === 'multiple' ? [...this.selection(), row] : [row];
    }

    this.selection.set(next);
    (selected ? this.rowUnselect : this.rowSelect).emit({ row, index: render.dataIndex });
  }

  toggleSelectAllOnPage(): void {
    const rows = this.pageRows();
    if (this.allPageSelected()) {
      this.selection.set(this.selection().filter((item) => !rows.some((row) => this.sameRow(row, item))));
    } else {
      const merged = [...this.selection()];
      for (const row of rows) if (!this.isSelected(row)) merged.push(row);
      this.selection.set(merged);
    }
  }

  private sameRow(a: T, b: T): boolean {
    const key = this.dataKey();
    if (!key) return a === b;
    return resolveField(a, key) === resolveField(b, key);
  }

  // ── Expansion ────────────────────────────────────────────────
  isExpanded(render: HkRenderRow<T>): boolean {
    return !!this.expandedKeys()[render.key];
  }

  toggleExpansion(render: HkRenderRow<T>): void {
    const key = render.key;
    const current = this.expandedKeys();
    const open = !!current[key];
    const next = this.expandMode() === 'single' && !open ? {} : { ...current };
    if (open) delete next[key];
    else next[key] = true;
    this.expandedKeys.set(next);
    (open ? this.rowCollapse : this.rowExpand).emit({ row: render.row, key });
  }

  expandAll(): void {
    const next: Record<string, boolean> = {};
    for (const render of this.renderRows()) if (render.kind === 'data') next[render.key] = true;
    this.expandedKeys.set(next);
  }

  collapseAll(): void {
    this.expandedKeys.set({});
  }

  // ── Grouping ─────────────────────────────────────────────────
  isGroupCollapsed(render: HkRenderRow<T>): boolean {
    return this.collapsedGroups().has(String(render.groupValue ?? ''));
  }

  toggleGroup(render: HkRenderRow<T>): void {
    if (!this.collapsibleGroups()) return;
    const id = String(render.groupValue ?? '');
    const next = new Set(this.collapsedGroups());
    if (next.has(id)) next.delete(id);
    else next.add(id);
    this.collapsedGroups.set(next);
  }

  /** In rowspan mode the grouping column renders once per group. */
  skipGroupCell(render: HkRenderRow<T>, leaf: HkLeafColumn<T>): boolean {
    return (
      this.rowGroupMode() === 'rowspan' &&
      !!this.groupRowsBy() &&
      leaf.field === this.groupRowsBy() &&
      !render.isGroupStart
    );
  }

  groupCellSpan(render: HkRenderRow<T>, leaf: HkLeafColumn<T>): number | null {
    if (this.rowGroupMode() !== 'rowspan' || leaf.field !== this.groupRowsBy()) return null;
    return render.groupSpan ?? null;
  }

  // ── Editing ──────────────────────────────────────────────────
  isEditableCell(leaf: HkLeafColumn<T>): boolean {
    return this.editMode() !== null && leaf.column.editable === true;
  }

  isCellEditing(render: HkRenderRow<T>, leaf: HkLeafColumn<T>): boolean {
    if (!this.isEditableCell(leaf)) return false;
    if (this.editMode() === 'row') return this.editingRows().has(render.key);
    const editing = this.editingCell();
    return editing?.key === render.key && editing.field === leaf.id;
  }

  startCellEdit(render: HkRenderRow<T>, leaf: HkLeafColumn<T>): void {
    if (this.editMode() !== 'cell' || !this.isEditableCell(leaf)) return;
    this.editingCell.set({ key: render.key, field: leaf.id });
  }

  editorValue(render: HkRenderRow<T>, leaf: HkLeafColumn<T>): string {
    const value = resolveField(render.row, leaf.field);
    if (value instanceof Date) return value.toISOString().slice(0, 10);
    return value == null ? '' : String(value);
  }

  editorType(leaf: HkLeafColumn<T>): string {
    if (leaf.column.editor === 'number' || leaf.column.numeric) return 'number';
    if (leaf.column.editor === 'date') return 'date';
    return 'text';
  }

  editorOptionsOf(leaf: HkLeafColumn<T>): HkSelectOption[] {
    return normaliseOptions(leaf.column.editorOptions);
  }

  onEditorInput(render: HkRenderRow<T>, leaf: HkLeafColumn<T>, event: Event): void {
    const raw = (event.target as HTMLInputElement | HTMLSelectElement).value;
    this.stageValue(render, leaf, raw);
  }

  onEditorCommit(render: HkRenderRow<T>, leaf: HkLeafColumn<T>, event: Event): void {
    const raw = (event.target as HTMLInputElement | HTMLSelectElement).value;
    this.commitValue(render, leaf, raw);
    if (this.editMode() === 'cell') this.editingCell.set(null);
  }

  onEditorCancel(render: HkRenderRow<T>, leaf: HkLeafColumn<T>): void {
    const draft = this.rowDrafts.get(render.key);
    if (draft && leaf.field in draft) {
      (render.row as Record<string, any>)[leaf.field] = draft[leaf.field];
    }
    this.editingCell.set(null);
    this.editCancel.emit({
      row: render.row,
      index: render.dataIndex,
      column: leaf.column,
      field: leaf.field,
      value: resolveField(render.row, leaf.field),
      oldValue: draft?.[leaf.field]
    });
    this.dataVersion.update((version) => version + 1);
  }

  /** Keeps the row object current while typing, without emitting. */
  private stageValue(render: HkRenderRow<T>, leaf: HkLeafColumn<T>, raw: unknown): void {
    if (!this.rowDrafts.has(render.key)) this.rowDrafts.set(render.key, {});
    const draft = this.rowDrafts.get(render.key)!;
    if (!(leaf.field in draft)) {
      (draft as Record<string, unknown>)[leaf.field] = resolveField(render.row, leaf.field);
    }
    this.writeCell(render.row, leaf, raw);
  }

  private commitValue(render: HkRenderRow<T>, leaf: HkLeafColumn<T>, raw: unknown): void {
    const oldValue = this.rowDrafts.get(render.key)?.[leaf.field] ?? resolveField(render.row, leaf.field);
    this.writeCell(render.row, leaf, raw);
    const value = resolveField(render.row, leaf.field);
    if (this.editMode() === 'cell') this.rowDrafts.delete(render.key);
    this.dataVersion.update((version) => version + 1);
    if (value === oldValue) return;
    this.editComplete.emit({
      row: render.row,
      index: render.dataIndex,
      column: leaf.column,
      field: leaf.field,
      value,
      oldValue
    });
  }

  private writeCell(row: T, leaf: HkLeafColumn<T>, raw: unknown): void {
    const next =
      this.editorType(leaf) === 'number' && typeof raw === 'string' ? toNumber(raw) : raw;
    const keys = leaf.field.split('.');
    const last = keys.pop() as string;
    let target: Record<string, any> = row;
    for (const key of keys) {
      if (target[key] == null || typeof target[key] !== 'object') target[key] = {};
      target = target[key];
    }
    target[last] = next;
  }

  startRowEdit(render: HkRenderRow<T>): void {
    const draft: Record<string, unknown> = {};
    for (const leaf of this.leaves()) {
      if (leaf.column.editable) draft[leaf.field] = resolveField(render.row, leaf.field);
    }
    this.rowDrafts.set(render.key, draft as Partial<T>);
    this.editingRows.set(new Set(this.editingRows()).add(render.key));
  }

  saveRowEdit(render: HkRenderRow<T>): void {
    const next = new Set(this.editingRows());
    next.delete(render.key);
    this.editingRows.set(next);
    const draft = this.rowDrafts.get(render.key);
    this.rowDrafts.delete(render.key);
    this.dataVersion.update((version) => version + 1);
    for (const leaf of this.leaves()) {
      if (!leaf.column.editable) continue;
      const value = resolveField(render.row, leaf.field);
      const oldValue = draft?.[leaf.field];
      if (value === oldValue) continue;
      this.editComplete.emit({
        row: render.row,
        index: render.dataIndex,
        column: leaf.column,
        field: leaf.field,
        value,
        oldValue
      });
    }
  }

  cancelRowEdit(render: HkRenderRow<T>): void {
    const draft = this.rowDrafts.get(render.key);
    if (draft) {
      for (const [field, value] of Object.entries(draft)) {
        (render.row as Record<string, any>)[field] = value;
      }
    }
    this.rowDrafts.delete(render.key);
    const next = new Set(this.editingRows());
    next.delete(render.key);
    this.editingRows.set(next);
    this.dataVersion.update((version) => version + 1);
  }

  isRowEditing(render: HkRenderRow<T>): boolean {
    return this.editingRows().has(render.key);
  }

  // ── Column visibility ────────────────────────────────────────
  toggleColumn(id: string): void {
    const next = new Set(this.hidden());
    if (next.has(id)) next.delete(id);
    else next.add(id);
    this.hidden.set(next);
    this.columnVisibility.emit({ hidden: [...next] });
  }

  showAllColumns(): void {
    this.hidden.set(new Set<string>());
    this.columnVisibility.emit({ hidden: [] });
  }

  // ── Column resize ────────────────────────────────────────────
  onResizeStart(event: PointerEvent, leaf: HkLeafColumn<T>): void {
    event.preventDefault();
    event.stopPropagation();
    const cell = (event.target as HTMLElement).closest('th') as HTMLElement | null;
    if (!cell) return;

    if (!this.layoutFixed()) this.snapshotWidths();
    this.resizeState = {
      id: leaf.id,
      startX: event.clientX,
      startWidth: cell.getBoundingClientRect().width,
      column: leaf.column
    };
    this.host.nativeElement.classList.add('is-resizing');
    this.zone.runOutsideAngular(() => {
      window.addEventListener('pointermove', this.onResizeMove);
      window.addEventListener('pointerup', this.onResizeEnd);
    });
  }

  private readonly onResizeMove = (event: PointerEvent): void => {
    if (!this.resizeState) return;
    this.pendingResizeX = event.clientX;
    if (this.resizeFrame !== null) return;
    // One width write per animation frame, whatever rate the pointer fires at.
    this.resizeFrame = requestAnimationFrame(() => {
      this.resizeFrame = null;
      const state = this.resizeState;
      if (!state) return;
      const min = parseFloat(state.column.minWidth ?? '') || 48;
      const width = Math.max(min, state.startWidth + (this.pendingResizeX - state.startX));
      this.zone.run(() =>
        this.widths.update((widths) => ({ ...widths, [state.id]: `${Math.round(width)}px` }))
      );
    });
  };

  private readonly onResizeEnd = (): void => {
    const state = this.resizeState;
    if (this.resizeFrame !== null) cancelAnimationFrame(this.resizeFrame);
    this.resizeFrame = null;
    window.removeEventListener('pointermove', this.onResizeMove);
    window.removeEventListener('pointerup', this.onResizeEnd);
    this.host.nativeElement.classList.remove('is-resizing');
    this.resizeState = null;
    if (!state) return;
    const width = parseFloat(this.widths()[state.id] ?? '0');
    this.columnResize.emit({ column: state.column, width });
  };

  /** Freezes the current rendered widths so a drag only moves one edge. */
  private snapshotWidths(): void {
    const table = this.tableEl()?.nativeElement;
    if (!table) return;
    const next: Record<string, string> = { ...this.widths() };
    table.querySelectorAll<HTMLElement>('th[data-col-id]').forEach((cell) => {
      const id = cell.dataset['colId'];
      if (id && !next[id]) next[id] = `${Math.round(cell.getBoundingClientRect().width)}px`;
    });
    this.widths.set(next);
    this.layoutFixed.set(true);
  }

  // ── Column reorder ───────────────────────────────────────────
  onDragStart(event: DragEvent, key: string): void {
    if (!this.reorderableColumns()) return;
    this.dragColumnKey = key;
    event.dataTransfer?.setData('text/plain', key);
    if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
  }

  onDragOver(event: DragEvent): void {
    if (!this.reorderableColumns() || !this.dragColumnKey) return;
    event.preventDefault();
  }

  onDrop(event: DragEvent, targetKey: string): void {
    if (!this.reorderableColumns()) return;
    event.preventDefault();
    const source = this.dragColumnKey;
    this.dragColumnKey = null;
    if (!source || source === targetKey) return;

    const current = this.order() ?? this.effectiveColumns().map((column) => column.key);
    const next = [...current];
    const from = next.indexOf(source);
    const to = next.indexOf(targetKey);
    if (from === -1 || to === -1) return;
    next.splice(to, 0, ...next.splice(from, 1));
    this.order.set(next);
    this.columnReorder.emit({ order: next });
  }

  // ── Frozen columns / sticky header ───────────────────────────
  leftOffset(id: string): number | null {
    return this.frozenLeftOffsets()[id] ?? null;
  }

  rightOffset(id: string): number | null {
    return this.frozenRightOffsets()[id] ?? null;
  }

  frozenSideOf(leaf: HkLeafColumn<T>): 'left' | 'right' | null {
    const frozen = leaf.column.frozen;
    return frozen === 'left' || frozen === 'right' ? frozen : null;
  }

  /** Leading control cells ride along with a left-frozen first column. */
  leadingFrozen(): boolean {
    return this.hasFrozenLeft();
  }

  headerTop(rowIndex: number): number {
    return this.headerRowOffsets()[rowIndex] ?? 0;
  }

  private scheduleMeasure(): void {
    if (this.measureScheduled || typeof requestAnimationFrame === 'undefined') return;
    this.measureScheduled = true;
    requestAnimationFrame(() => {
      this.measureScheduled = false;
      this.measureGeometry();
    });
  }

  /**
   * Reads real rendered widths so sticky offsets are exact even when columns
   * size themselves. Header cells carry `data-col-id`, so one query is enough.
   */
  private measureGeometry(): void {
    const table = this.tableEl()?.nativeElement;
    if (!table) return;

    const widthById = new Map<string, number>();
    table.querySelectorAll<HTMLElement>('th[data-col-id]').forEach((cell) => {
      const id = cell.dataset['colId'];
      if (id) widthById.set(id, cell.getBoundingClientRect().width);
    });

    const ids = [
      ...this.leadingCells(),
      ...this.leaves().map((leaf) => leaf.id),
      ...(this.hasEditColumn() ? [CELL_EDIT] : [])
    ];
    const frozenLeftIds = new Set<string>(
      this.hasFrozenLeft()
        ? [
            ...this.leadingCells(),
            ...this.leaves().filter((leaf) => leaf.column.frozen === 'left').map((leaf) => leaf.id)
          ]
        : []
    );
    const frozenRightIds = new Set<string>(
      this.leaves().filter((leaf) => leaf.column.frozen === 'right').map((leaf) => leaf.id)
    );

    const left: Record<string, number> = {};
    let offset = 0;
    for (const id of ids) {
      if (!frozenLeftIds.has(id)) continue;
      left[id] = offset;
      offset += widthById.get(id) ?? 0;
    }

    const right: Record<string, number> = {};
    offset = 0;
    for (const id of [...ids].reverse()) {
      if (!frozenRightIds.has(id)) continue;
      right[id] = offset;
      offset += widthById.get(id) ?? 0;
    }

    const offsets: number[] = [];
    let top = 0;
    table.querySelectorAll<HTMLElement>('thead tr').forEach((row) => {
      offsets.push(top);
      top += row.getBoundingClientRect().height;
    });

    this.frozenLeftOffsets.set(left);
    this.frozenRightOffsets.set(right);
    this.headerRowOffsets.set(offsets);
  }

  private observeViewport(): void {
    const element = this.scroller()?.nativeElement;
    if (!element || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => {
      this.viewportHeight.set(element.clientHeight);
      this.scheduleMeasure();
    });
    observer.observe(element);
    this.viewportHeight.set(element.clientHeight);
    this.destroyRef.onDestroy(() => observer.disconnect());
  }

  /**
   * Scroll is listened to outside Angular and only re-enters when the visible
   * window actually moves by a row. A template (scroll) binding would run
   * change detection on all ~60 scroll events a second instead.
   */
  private attachScroll(): void {
    const element = this.scroller()?.nativeElement;
    if (!element) return;
    let lastStart = -1;

    const onScroll = (): void => {
      if (!this.virtualScroll()) return;
      const rowHeight = Math.max(12, this.virtualRowHeight());
      const buffer = Math.max(0, this.virtualBuffer());
      const start = Math.max(0, Math.floor(element.scrollTop / rowHeight) - buffer);
      if (start === lastStart) return;
      lastStart = start;
      this.zone.run(() => this.scrollTop.set(element.scrollTop));
    };

    this.zone.runOutsideAngular(() => element.addEventListener('scroll', onScroll, { passive: true }));
    this.destroyRef.onDestroy(() => element.removeEventListener('scroll', onScroll));
  }

  // ── Keyboard navigation ──────────────────────────────────────
  onKeydown(event: KeyboardEvent): void {
    if (!this.keyboardNavigation()) return;
    const cell = (event.target as HTMLElement).closest<HTMLElement>('[data-cell]');
    if (!cell) return;
    const [rowIndex, colIndex] = (cell.dataset['cell'] ?? '0-0').split('-').map(Number);

    // Let editors own their own keys.
    if ((event.target as HTMLElement).matches('input,select,textarea')) return;

    const render = this.renderRowAt(rowIndex);
    if (event.key === 'Enter' && render?.kind === 'data') {
      const leaf = this.leafAtColumn(colIndex);
      if (leaf && this.editMode() === 'cell' && this.isEditableCell(leaf)) {
        event.preventDefault();
        this.startCellEdit(render, leaf);
        return;
      }
    }
    if (event.key === ' ' && render?.kind === 'data' && this.selectionMode()) {
      event.preventDefault();
      this.toggleRowSelection(render, this.selectionMode() !== 'single');
      return;
    }

    const keys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End'];
    if (!keys.includes(event.key)) return;

    event.preventDefault();
    const rowCount = this.visibleRows().length;
    const colCount = this.totalColumns();
    let nextRow = rowIndex;
    let nextCol = colIndex;

    if (event.key === 'ArrowUp') nextRow = Math.max(0, rowIndex - 1);
    if (event.key === 'ArrowDown') nextRow = Math.min(rowCount - 1, rowIndex + 1);
    if (event.key === 'ArrowLeft') nextCol = Math.max(0, colIndex - 1);
    if (event.key === 'ArrowRight') nextCol = Math.min(colCount - 1, colIndex + 1);
    if (event.key === 'Home') nextCol = 0;
    if (event.key === 'End') nextCol = colCount - 1;

    this.focusCell(nextRow, nextCol);
  }

  private focusCell(row: number, col: number): void {
    const target = this.host.nativeElement.querySelector<HTMLElement>(
      `[data-cell="${row}-${col}"]`
    );
    if (!target) return;
    this.focusedCell.set({ row, col });
    target.focus();
  }

  cellTabIndex(rowIndex: number, colIndex: number): number {
    if (!this.keyboardNavigation()) return -1;
    const focused = this.focusedCell();
    if (!focused) return rowIndex === 0 && colIndex === 0 ? 0 : -1;
    return focused.row === rowIndex && focused.col === colIndex ? 0 : -1;
  }

  // ── Export ───────────────────────────────────────────────────
  exportCsv(): void {
    const leaves = this.leaves().filter((leaf) => leaf.column.exportable !== false);
    const headers = leaves.map((leaf) => leaf.column.header ?? leaf.column.key);
    const source = this.lazy() ? this.value() : this.processed();
    const rows = source.map((row) => leaves.map((leaf) => this.formatCell(row, leaf)));
    const csv = toCsv(headers, rows);

    const blob = new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${this.exportFilename()}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  // ── Public helpers ───────────────────────────────────────────
  /** Clears sort, filters, paging and column state back to the defaults. */
  reset(): void {
    this.sort.set([]);
    this.filters.set({});
    this.globalFilter.set('');
    this.first.set(0);
    this.hidden.set(new Set<string>());
    this.widths.set({});
    this.order.set(null);
    this.layoutFixed.set(false);
    this.collapsedGroups.set(new Set<string>());
    if (this.lazy()) this.emitLazy('refresh');
  }

  // ── State persistence ────────────────────────────────────────
  private storage(): Storage | null {
    if (typeof window === 'undefined' || !this.stateKey()) return null;
    try {
      return this.stateStorage() === 'session' ? window.sessionStorage : window.localStorage;
    } catch {
      return null;
    }
  }

  private restoreState(): void {
    const store = this.storage();
    if (!store) return;
    try {
      const raw = store.getItem(`hk-table:${this.stateKey()}`);
      if (!raw) return;
      const state = JSON.parse(raw) as HkTableState;
      if (state.first !== undefined) this.first.set(state.first);
      if (state.rows !== undefined) this.rows.set(state.rows);
      if (state.sort) this.sort.set(state.sort);
      if (state.filters) this.filters.set(state.filters);
      if (state.globalFilter !== undefined) this.globalFilter.set(state.globalFilter);
      if (state.hidden) this.hidden.set(new Set(state.hidden));
      if (state.widths) {
        this.widths.set(state.widths);
        if (Object.keys(state.widths).length) this.layoutFixed.set(true);
      }
      if (state.order) this.order.set(state.order);
    } catch {
      // A malformed entry is not worth failing a render over.
    }
  }

  private saveState(state: HkTableState): void {
    const store = this.storage();
    if (!store) return;
    try {
      store.setItem(`hk-table:${this.stateKey()}`, JSON.stringify(state));
    } catch {
      // Quota or private mode — state is a convenience, not a contract.
    }
  }

  // Ids exposed to the template.
  readonly ids = {
    expander: CELL_EXPANDER,
    select: CELL_SELECT,
    index: CELL_INDEX,
    edit: CELL_EDIT
  };
}
