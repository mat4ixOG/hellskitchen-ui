/**
 * Public type surface for <hk-table>.
 *
 * Everything the grid can do is described here so a consumer can type their
 * column definitions and event handlers without reaching into the component.
 */
import { TemplateRef } from '@angular/core';

export type HkSortOrder = 1 | -1 | 0;

export type HkAlign = 'left' | 'center' | 'right';

export type HkFrozen = 'left' | 'right' | false;

/** Which editor/filter widget a column gets. */
export type HkFilterType =
  | 'none'
  | 'text'
  | 'number'
  | 'date'
  | 'boolean'
  | 'select'
  | 'multiselect';

export type HkMatchMode =
  | 'contains'
  | 'notContains'
  | 'startsWith'
  | 'endsWith'
  | 'equals'
  | 'notEquals'
  | 'in'
  | 'lt'
  | 'lte'
  | 'gt'
  | 'gte'
  | 'between'
  | 'dateIs'
  | 'dateIsNot'
  | 'dateBefore'
  | 'dateAfter'
  | 'empty'
  | 'notEmpty';

export type HkAggregate =
  | 'sum'
  | 'avg'
  | 'min'
  | 'max'
  | 'count'
  | 'countDistinct'
  | ((rows: any[], column: HkColumn) => unknown);

export interface HkSelectOption {
  label: string;
  value: unknown;
}

/**
 * One column, or one header group when `children` is set.
 *
 * `children` may nest to any depth — the grid derives the colspan/rowspan
 * matrix from the tree, so a three-deep header needs no manual markup.
 */
export interface HkColumn<T = any> {
  /** Stable identity. Doubles as the data path when `field` is omitted. */
  key: string;
  /** Header label. Plain text; use `headerHtml` when you need markup. */
  header?: string;
  /** Header label rendered as HTML — for units, line breaks, superscripts. */
  headerHtml?: string;
  /** Dot-notated data path, when it differs from `key`. */
  field?: string;
  /** Nested header group. A node with children renders no cells of its own. */
  children?: HkColumn<T>[];

  // ── Sorting ──────────────────────────────────────────────
  sortable?: boolean;
  /** Path to sort by, when it differs from the displayed field. */
  sortField?: string;
  /** Full control over ordering. Return <0, 0, >0 — the grid applies order. */
  comparator?: (a: unknown, b: unknown, rowA: T, rowB: T) => number;

  // ── Filtering ────────────────────────────────────────────
  filter?: HkFilterType;
  filterMatchMode?: HkMatchMode;
  /** Options for select/multiselect. Derived from the data when omitted. */
  filterOptions?: (HkSelectOption | string | number)[];
  filterPlaceholder?: string;
  /** Bypasses the built-in match modes entirely. */
  filterPredicate?: (value: unknown, filterValue: unknown, row: T) => boolean;

  // ── Layout ───────────────────────────────────────────────
  align?: HkAlign;
  width?: string;
  minWidth?: string;
  maxWidth?: string;
  /** Pins the column against the left or right edge while the body scrolls. */
  frozen?: HkFrozen;
  resizable?: boolean;
  hidden?: boolean;

  // ── Content ──────────────────────────────────────────────
  /** Marks the column numeric: right aligns, groups digits, sorts as number. */
  numeric?: boolean;
  /** Locale for digit grouping. Defaults to the table's `numberLocale`. */
  numberLocale?: string;
  /** Fraction digits for numeric cells. */
  digits?: number;
  /** Last word on the rendered string. Wins over `numeric` formatting. */
  format?: (value: unknown, row: T) => string;
  /** Truncates long text to N characters with an ellipsis and a title attr. */
  truncate?: number;
  /** Shown when the value is null/undefined/''. */
  emptyValue?: string;
  cellClass?: string | ((value: unknown, row: T) => string);
  headerClass?: string;
  footerClass?: string;

  // ── Templates (looked up by name among [hkTemplate] children) ─────
  /** Overrides the `cell:<key>` template lookup. */
  cellTemplate?: string;
  headerTemplate?: string;
  footerTemplate?: string;
  editorTemplate?: string;

  // ── Editing ──────────────────────────────────────────────
  editable?: boolean;
  editor?: 'text' | 'number' | 'date' | 'select';
  editorOptions?: (HkSelectOption | string | number)[];

  // ── Footer ───────────────────────────────────────────────
  /** Footer aggregate. Also used for group footers. */
  aggregate?: HkAggregate;
  /** Static footer label — for the leading "Total" cell, say. */
  footer?: string;

  // ── Misc ─────────────────────────────────────────────────
  /** Excluded from CSV export when false. */
  exportable?: boolean;
  /** Excluded from the global search when false. */
  searchable?: boolean;
  /** Excluded from the column-visibility menu when false. */
  toggleable?: boolean;
  /** Anything you need in a template — the grid never reads it. */
  meta?: Record<string, unknown>;
}

/** A flattened leaf column, resolved against its ancestors. */
export interface HkLeafColumn<T = any> {
  column: HkColumn<T>;
  /** Full path from the root of the column tree. */
  path: string[];
  /** `path` joined with dots — the identity used by filters and state. */
  id: string;
  /** Data path actually read from the row. */
  field: string;
  ancestors: HkColumn<T>[];
  parent: HkColumn<T> | null;
  /** Depth-first index among visible leaves. */
  index: number;
}

/** One rendered header cell. */
export interface HkHeaderCell<T = any> {
  column: HkColumn<T>;
  leaf: HkLeafColumn<T> | null;
  colSpan: number;
  rowSpan: number;
  isLeaf: boolean;
}

export interface HkSortMeta {
  field: string;
  order: HkSortOrder;
}

export interface HkFilterMeta {
  value: unknown;
  matchMode: HkMatchMode;
  /** Second operand for `between`. */
  value2?: unknown;
}

export type HkFilterState = Record<string, HkFilterMeta>;

/** Emitted whenever the grid needs a page of server data. */
export interface HkTableLazyEvent {
  first: number;
  rows: number;
  sort: HkSortMeta[];
  filters: HkFilterState;
  globalFilter: string;
  /** Reason for the load, so a handler can skip redundant round trips. */
  trigger: 'init' | 'page' | 'sort' | 'filter' | 'refresh';
}

export interface HkPageEvent {
  first: number;
  rows: number;
  page: number;
  pageCount: number;
  totalRecords: number;
}

export interface HkRowEvent<T = any> {
  row: T;
  index: number;
  originalEvent?: Event;
}

export interface HkCellEvent<T = any> extends HkRowEvent<T> {
  column: HkColumn<T>;
  field: string;
  value: unknown;
}

export interface HkEditEvent<T = any> {
  row: T;
  index: number;
  column: HkColumn<T>;
  field: string;
  value: unknown;
  oldValue: unknown;
}

export interface HkColumnResizeEvent {
  column: HkColumn;
  width: number;
}

export interface HkColumnReorderEvent {
  column: HkColumn;
  fromIndex: number;
  toIndex: number;
  order: string[];
}

/** One row in the rendered stream — a data row, or a group boundary. */
export interface HkRenderRow<T = any> {
  kind: 'data' | 'groupHeader' | 'groupFooter';
  row: T;
  /** Index within the fully processed (filtered + sorted) data set. */
  dataIndex: number;
  /** 1-based serial number, continuous across pages. */
  serial: number;
  key: string;
  groupValue?: unknown;
  groupRows?: T[];
  /** Rowspan for the grouping column in `rowspan` group mode. */
  groupSpan?: number;
  isGroupStart?: boolean;
}

export type HkRowGroupMode = 'subheader' | 'rowspan';

export type HkSelectionMode = 'single' | 'multiple' | 'checkbox' | null;

export type HkEditMode = 'cell' | 'row' | null;

export type HkTableSize = 'sm' | 'md' | 'lg';

/** Persisted slice of grid state, when `stateKey` is set. */
export interface HkTableState {
  first?: number;
  rows?: number;
  sort?: HkSortMeta[];
  filters?: HkFilterState;
  globalFilter?: string;
  hidden?: string[];
  widths?: Record<string, string>;
  order?: string[];
}

/** Context handed to every `cell:` template. */
export interface HkCellContext<T = any> {
  $implicit: unknown;
  value: unknown;
  row: T;
  column: HkColumn<T>;
  rowIndex: number;
  serial: number;
  /** Convenience for editors — writes through to the row. */
  set?: (next: unknown) => void;
}

export interface HkTemplateMap {
  [name: string]: TemplateRef<any> | undefined;
}
