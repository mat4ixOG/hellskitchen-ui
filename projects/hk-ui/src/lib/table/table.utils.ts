/**
 * Pure helpers behind <hk-table>. Kept free of Angular so they can be unit
 * tested — and reused — without instantiating the grid.
 */
import {
  HkAggregate,
  HkColumn,
  HkFilterMeta,
  HkFilterType,
  HkHeaderCell,
  HkLeafColumn,
  HkMatchMode,
  HkSelectOption
} from './table.types';

/** Reads a dot-notated path off a row. Returns undefined on any nullish hop. */
export function resolveField(row: unknown, path: string | undefined): unknown {
  if (row == null || !path) return undefined;
  if (path.indexOf('.') === -1) return (row as Record<string, unknown>)[path];
  return path
    .split('.')
    .reduce<unknown>(
      (acc, key) => (acc == null ? undefined : (acc as Record<string, unknown>)[key]),
      row
    );
}

/** Writes a dot-notated path on a row, creating intermediate objects. */
export function assignField(row: Record<string, any>, path: string, value: unknown): void {
  const keys = path.split('.');
  const last = keys.pop() as string;
  let target = row;
  for (const key of keys) {
    if (target[key] == null || typeof target[key] !== 'object') target[key] = {};
    target = target[key];
  }
  target[last] = value;
}

export function isBlank(value: unknown): boolean {
  return value == null || value === '' || (Array.isArray(value) && value.length === 0);
}

/** True for numbers and for numeric strings — "1,240" included. */
export function isNumericValue(value: unknown): boolean {
  if (typeof value === 'number') return !Number.isNaN(value);
  if (typeof value !== 'string' || value.trim() === '') return false;
  return !Number.isNaN(Number(value.replace(/,/g, '')));
}

export function toNumber(value: unknown): number | null {
  if (typeof value === 'number') return Number.isNaN(value) ? null : value;
  if (typeof value === 'string') {
    const cleaned = value.replace(/,/g, '').trim();
    if (cleaned === '') return null;
    const parsed = Number(cleaned);
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
}

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

export function toDate(value: unknown): Date | null {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value === 'number') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  if (typeof value === 'string') {
    // `new Date('2026-03-02')` is UTC midnight per spec — west of UTC that is
    // the *previous* day locally. Anchoring to local midnight keeps a date
    // filter on the calendar day the user picked.
    const parsed = new Date(DATE_ONLY.test(value.trim()) ? `${value.trim()}T00:00:00` : value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
}

/** Day bounds as timestamps. Non-mutating — the Date may be the row's own. */
function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function endOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999).getTime();
}

/** Same calendar day, ignoring time. */
function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/**
 * Intl objects are expensive to build and cheap to reuse. A 50k-cell render
 * that constructs one formatter per cell spends most of its time in Intl, so
 * every formatter and collator the grid uses is memoised here.
 */
const numberFormats = new Map<string, Intl.NumberFormat>();

export function formatNumber(value: number, locale = 'en-US', digits?: number): string {
  const cacheKey = `${locale}|${digits ?? ''}`;
  let formatter = numberFormats.get(cacheKey);
  if (!formatter) {
    formatter = new Intl.NumberFormat(locale, {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits ?? 20
    });
    numberFormats.set(cacheKey, formatter);
  }
  return formatter.format(value);
}

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

// ── Column tree ────────────────────────────────────────────────

/** Depth of the column tree — the number of header rows to render. */
export function columnDepth(columns: HkColumn[]): number {
  if (!columns?.length) return 1;
  let max = 1;
  for (const node of columns) {
    const kids = visibleChildren(node);
    if (kids.length) max = Math.max(max, 1 + columnDepth(kids));
  }
  return max;
}

function visibleChildren(node: HkColumn): HkColumn[] {
  return (node.children ?? []).filter((child) => !child.hidden && !isEmptyGroup(child));
}

/** A group whose every descendant is hidden renders nothing at all. */
function isEmptyGroup(node: HkColumn): boolean {
  if (!node.children?.length) return false;
  return node.children.every((child) => child.hidden || isEmptyGroup(child));
}

/**
 * Flattens the column tree to the leaves that actually render cells, in
 * left-to-right order, each carrying its ancestor chain.
 */
export function flattenLeaves<T>(
  columns: HkColumn<T>[],
  ancestors: HkColumn<T>[] = [],
  parentPath: string[] = [],
  counter = { index: 0 }
): HkLeafColumn<T>[] {
  const leaves: HkLeafColumn<T>[] = [];
  for (const node of columns ?? []) {
    if (node.hidden || isEmptyGroup(node)) continue;
    const path = [...parentPath, node.key];
    const kids = visibleChildren(node);
    if (kids.length) {
      leaves.push(...flattenLeaves(kids, [...ancestors, node], path, counter));
    } else {
      leaves.push({
        column: node,
        path,
        id: path.join('.'),
        field: node.field ?? path.join('.'),
        ancestors,
        parent: ancestors.length ? ancestors[ancestors.length - 1] : null,
        index: counter.index++
      });
    }
  }
  return leaves;
}

/**
 * Builds the header matrix. Leaves stretch downward with a rowspan, groups
 * stretch sideways with a colspan equal to their visible leaf count.
 */
export function buildHeaderRows<T>(
  columns: HkColumn<T>[],
  leaves: HkLeafColumn<T>[]
): HkHeaderCell<T>[][] {
  const depth = columnDepth(columns);
  const rows: HkHeaderCell<T>[][] = Array.from({ length: depth }, () => []);
  const byColumn = new Map<HkColumn<T>, HkLeafColumn<T>>();
  for (const leaf of leaves) byColumn.set(leaf.column, leaf);

  const visit = (nodes: HkColumn<T>[], level: number): number => {
    let leafCount = 0;
    for (const node of nodes ?? []) {
      if (node.hidden || isEmptyGroup(node)) continue;
      const kids = visibleChildren(node);
      if (kids.length) {
        const span = visit(kids, level + 1);
        rows[level].push({ column: node, leaf: null, colSpan: span, rowSpan: 1, isLeaf: false });
        leafCount += span;
      } else {
        rows[level].push({
          column: node,
          leaf: byColumn.get(node) ?? null,
          colSpan: 1,
          rowSpan: depth - level,
          isLeaf: true
        });
        leafCount += 1;
      }
    }
    return leafCount;
  };

  visit(columns, 0);
  return rows;
}

/** Every leaf key in the tree, hidden ones included — for state and toggles. */
export function allLeafKeys(columns: HkColumn[], parentPath: string[] = []): string[] {
  const keys: string[] = [];
  for (const node of columns ?? []) {
    const path = [...parentPath, node.key];
    if (node.children?.length) keys.push(...allLeafKeys(node.children, path));
    else keys.push(path.join('.'));
  }
  return keys;
}

/** Deep-clones the tree applying hidden/width overrides, then reorders roots. */
export function applyColumnState<T>(
  columns: HkColumn<T>[],
  hidden: ReadonlySet<string>,
  widths: Readonly<Record<string, string>>,
  order: readonly string[] | null,
  parentPath: string[] = []
): HkColumn<T>[] {
  const mapped = (columns ?? []).map((node) => {
    const path = [...parentPath, node.key];
    const id = path.join('.');
    const next: HkColumn<T> = { ...node };
    if (node.children?.length) {
      next.children = applyColumnState(node.children, hidden, widths, null, path);
    } else {
      if (hidden.has(id)) next.hidden = true;
      if (widths[id]) next.width = widths[id];
    }
    return next;
  });

  if (!order?.length) return mapped;
  const rank = new Map(order.map((key, index) => [key, index]));
  return [...mapped].sort(
    (a, b) => (rank.get(a.key) ?? Number.MAX_SAFE_INTEGER) - (rank.get(b.key) ?? Number.MAX_SAFE_INTEGER)
  );
}

// ── Sorting ────────────────────────────────────────────────────

/** Natural comparison: numbers numerically, dates chronologically, else locale. */
export function defaultCompare(a: unknown, b: unknown): number {
  if (a == null && b == null) return 0;
  if (a == null) return -1;
  if (b == null) return 1;

  if (a instanceof Date && b instanceof Date) return a.getTime() - b.getTime();

  const numA = toNumber(a);
  const numB = toNumber(b);
  if (numA !== null && numB !== null) return numA - numB;

  return collator.compare(String(a), String(b));
}

// ── Filtering ──────────────────────────────────────────────────

export const MATCH_MODES: Record<HkFilterType, HkMatchMode[]> = {
  none: [],
  text: [
    'contains',
    'notContains',
    'startsWith',
    'endsWith',
    'equals',
    'notEquals',
    'empty',
    'notEmpty'
  ],
  number: ['equals', 'notEquals', 'lt', 'lte', 'gt', 'gte', 'between'],
  date: ['dateIs', 'dateIsNot', 'dateBefore', 'dateAfter', 'between'],
  boolean: ['equals'],
  select: ['equals', 'notEquals'],
  multiselect: ['in']
};

export const MATCH_MODE_LABELS: Record<HkMatchMode, string> = {
  contains: 'Contains',
  notContains: 'Not contains',
  startsWith: 'Starts with',
  endsWith: 'Ends with',
  equals: 'Equals',
  notEquals: 'Not equals',
  in: 'Any of',
  lt: 'Less than',
  lte: 'Less or equal',
  gt: 'Greater than',
  gte: 'Greater or equal',
  between: 'Between',
  dateIs: 'Date is',
  dateIsNot: 'Date is not',
  dateBefore: 'Before',
  dateAfter: 'After',
  empty: 'Is empty',
  notEmpty: 'Is not empty'
};

/** The match mode a filter type starts on. */
export function defaultMatchMode(type: HkFilterType): HkMatchMode {
  return MATCH_MODES[type]?.[0] ?? 'contains';
}

/** True when a filter has nothing to say and should be skipped. */
export function isFilterInactive(meta: HkFilterMeta | undefined): boolean {
  if (!meta) return true;
  if (meta.matchMode === 'empty' || meta.matchMode === 'notEmpty') return false;
  if (meta.matchMode === 'between') return isBlank(meta.value) && isBlank(meta.value2);
  return isBlank(meta.value);
}

/** Applies one match mode to one cell value. */
export function matches(value: unknown, meta: HkFilterMeta): boolean {
  const { matchMode, value: needle, value2 } = meta;

  switch (matchMode) {
    case 'empty':
      return isBlank(value);
    case 'notEmpty':
      return !isBlank(value);
    case 'in': {
      const list = Array.isArray(needle) ? needle : [needle];
      if (!list.length) return true;
      return list.some((item) => looseEquals(value, item));
    }
    case 'equals':
      return looseEquals(value, needle);
    case 'notEquals':
      return !looseEquals(value, needle);
    case 'contains':
      return text(value).includes(text(needle));
    case 'notContains':
      return !text(value).includes(text(needle));
    case 'startsWith':
      return text(value).startsWith(text(needle));
    case 'endsWith':
      return text(value).endsWith(text(needle));
    case 'lt':
    case 'lte':
    case 'gt':
    case 'gte': {
      const left = toNumber(value);
      const right = toNumber(needle);
      if (left === null || right === null) return false;
      if (matchMode === 'lt') return left < right;
      if (matchMode === 'lte') return left <= right;
      if (matchMode === 'gt') return left > right;
      return left >= right;
    }
    case 'between': {
      const low = toNumber(needle);
      const high = toNumber(value2);
      // Which range this is has to be decided from the *bounds the user
      // supplied*, never from the cell. Deciding it on `toNumber(needle)`
      // alone read a one-sided range — an empty lower bound with `10` above —
      // as a date range, and then compared the cell as a millisecond
      // timestamp: every value in the same 1970 day passed, so "≤ 10" matched
      // 50,000. A numeric range is one where every supplied bound is a number.
      const lowGiven = !isBlank(needle);
      const highGiven = !isBlank(value2);
      const numericRange =
        (lowGiven || highGiven) &&
        (!lowGiven || low !== null) &&
        (!highGiven || high !== null);

      if (!numericRange) {
        const cellDate = toDate(value);
        if (!cellDate) return false;
        const dateLeft = toDate(needle);
        const dateRight = toDate(value2);
        const time = cellDate.getTime();
        if (dateLeft && time < startOfDay(dateLeft)) return false;
        if (dateRight && time > endOfDay(dateRight)) return false;
        return true;
      }

      const cell = toNumber(value);
      if (cell === null) return false;
      if (low !== null && cell < low) return false;
      if (high !== null && cell > high) return false;
      return true;
    }
    case 'dateIs':
    case 'dateIsNot':
    case 'dateBefore':
    case 'dateAfter': {
      const cell = toDate(value);
      const needleDate = toDate(needle);
      if (!cell || !needleDate) return false;
      if (matchMode === 'dateIs') return sameDay(cell, needleDate);
      if (matchMode === 'dateIsNot') return !sameDay(cell, needleDate);
      if (matchMode === 'dateBefore') return cell.getTime() < startOfDay(needleDate);
      return cell.getTime() > endOfDay(needleDate);
    }
    default:
      return true;
  }
}

function text(value: unknown): string {
  return value == null ? '' : String(value).toLowerCase();
}

/**
 * Turns one filter into a closure with its operand already normalised — lower
 * cased, parsed to a number, or hashed into a Set. Filtering 100k rows then
 * costs one comparison per row instead of one re-parse per row.
 */
export function compileFilter(meta: HkFilterMeta): (value: unknown) => boolean {
  const mode = meta.matchMode;

  switch (mode) {
    case 'empty':
      return (value) => isBlank(value);
    case 'notEmpty':
      return (value) => !isBlank(value);

    case 'in': {
      const list = Array.isArray(meta.value) ? meta.value : [meta.value];
      if (!list.length) return () => true;
      const set = new Set(list.map((item) => String(item).toLowerCase()));
      return (value) => set.has(String(value).toLowerCase());
    }

    case 'contains':
    case 'notContains':
    case 'startsWith':
    case 'endsWith': {
      const needle = text(meta.value);
      const test =
        mode === 'startsWith'
          ? (haystack: string) => haystack.startsWith(needle)
          : mode === 'endsWith'
            ? (haystack: string) => haystack.endsWith(needle)
            : (haystack: string) => haystack.includes(needle);
      const negate = mode === 'notContains';
      return (value) => {
        const hit = test(value == null ? '' : String(value).toLowerCase());
        return negate ? !hit : hit;
      };
    }

    case 'lt':
    case 'lte':
    case 'gt':
    case 'gte': {
      const bound = toNumber(meta.value);
      if (bound === null) return () => true;
      if (mode === 'lt') return (value) => lessThan(value, bound, false);
      if (mode === 'lte') return (value) => lessThan(value, bound, true);
      if (mode === 'gt') return (value) => greaterThan(value, bound, false);
      return (value) => greaterThan(value, bound, true);
    }

    default:
      // Equality, between and the date modes stay on the generic path — they
      // are cheap enough and the branchy logic is better kept in one place.
      return (value) => matches(value, meta);
  }
}

function lessThan(value: unknown, bound: number, orEqual: boolean): boolean {
  const numeric = toNumber(value);
  if (numeric === null) return false;
  return orEqual ? numeric <= bound : numeric < bound;
}

function greaterThan(value: unknown, bound: number, orEqual: boolean): boolean {
  const numeric = toNumber(value);
  if (numeric === null) return false;
  return orEqual ? numeric >= bound : numeric > bound;
}

/** Equality that survives the string/number/boolean round trip through inputs. */
function looseEquals(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (typeof a === 'boolean' || typeof b === 'boolean') {
    return String(a) === String(b);
  }
  const numA = toNumber(a);
  const numB = toNumber(b);
  if (numA !== null && numB !== null) return numA === numB;
  return String(a).toLowerCase() === String(b).toLowerCase();
}

/** Distinct values of a field, sorted, ready for a select/multiselect filter. */
export function deriveOptions(rows: unknown[], field: string): HkSelectOption[] {
  const seen = new Map<string, HkSelectOption>();
  for (const row of rows ?? []) {
    const value = resolveField(row, field);
    if (value == null || value === '') continue;
    if (typeof value === 'object') continue;
    const id = String(value);
    if (!seen.has(id)) seen.set(id, { label: id, value });
  }
  return [...seen.values()].sort((a, b) => defaultCompare(a.value, b.value));
}

/** Accepts the shorthand option forms and normalises them. */
export function normaliseOptions(
  options: (HkSelectOption | string | number)[] | undefined
): HkSelectOption[] {
  return (options ?? []).map((option) =>
    typeof option === 'object' && option !== null && 'label' in option
      ? (option as HkSelectOption)
      : { label: String(option), value: option }
  );
}

/** Cheap lowercase text for the global search — no Intl, no allocation games. */
export function searchText(value: unknown): string {
  if (value == null) return '';
  const type = typeof value;
  if (type === 'string') return (value as string).toLowerCase();
  if (type === 'number' || type === 'boolean') return String(value);
  if (value instanceof Date) return value.toISOString();
  return String(value).toLowerCase();
}

// ── Aggregates ─────────────────────────────────────────────────

export function aggregate(rows: any[], column: HkColumn, field: string): unknown {
  const spec: HkAggregate | undefined = column.aggregate;
  if (!spec) return undefined;
  if (typeof spec === 'function') return spec(rows, column);

  if (spec === 'count') return rows.length;
  if (spec === 'countDistinct') {
    return new Set(rows.map((row) => String(resolveField(row, field)))).size;
  }

  const numbers = rows
    .map((row) => toNumber(resolveField(row, field)))
    .filter((value): value is number => value !== null);
  if (!numbers.length) return null;

  switch (spec) {
    case 'sum':
      return numbers.reduce((total, value) => total + value, 0);
    case 'avg':
      return numbers.reduce((total, value) => total + value, 0) / numbers.length;
    // Not `Math.min(...numbers)`: spreading pushes one argument per row onto
    // the stack, so a column the grid is explicitly built to handle — ~125k
    // rows and up — threw RangeError instead of returning a footer value.
    case 'min':
      return numbers.reduce((lowest, value) => (value < lowest ? value : lowest));
    case 'max':
      return numbers.reduce((highest, value) => (value > highest ? value : highest));
    default:
      return null;
  }
}

// ── Export ─────────────────────────────────────────────────────

/**
 * A leading `=`, `+`, `-` or `@` makes Excel, LibreOffice and Sheets evaluate
 * the cell as a formula, so a value typed into the table by one user runs as
 * code on whoever opens the export. Prefixing a tab keeps the text intact and
 * inert.
 *
 * Numbers are exempt, and have to be: `-5` is a negative number in every real
 * dataset, and neutralising it would turn a numeric column into text.
 */
function neutralise(raw: string): string {
  if (!/^[=+\-@\t\r]/.test(raw)) return raw;
  const numeric = raw !== '' && Number.isFinite(Number(raw));
  return numeric ? raw : `\t${raw}`;
}

/**
 * RFC 4180 quoting — a field containing a quote, a newline or the active
 * separator gets wrapped. The separator matters: quoting only against `,` while
 * joining on `;` shifts every column after the first offending cell.
 */
export function csvCell(value: unknown, separator = ','): string {
  const raw = neutralise(value == null ? '' : String(value));
  const needsQuotes =
    raw.includes('"') ||
    raw.includes('\n') ||
    raw.includes('\r') ||
    (separator !== '' && raw.includes(separator));
  return needsQuotes ? `"${raw.replace(/"/g, '""')}"` : raw;
}

export function toCsv(headers: string[], rows: unknown[][], separator = ','): string {
  // Wrapped rather than passed straight to `map`, which would hand `csvCell`
  // the array index as its separator.
  const cell = (value: unknown): string => csvCell(value, separator);
  const lines = [headers.map(cell).join(separator)];
  for (const row of rows) lines.push(row.map(cell).join(separator));
  return lines.join('\r\n');
}
