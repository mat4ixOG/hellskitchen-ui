import { Component, signal, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { HkTableComponent } from './hk-table.component';
import { HkTemplate } from './hk-table-template.directive';
import { HkColumn } from './table.types';

interface Row {
  id: number;
  service: string;
  region: string;
  units: number;
  revenue: { q1: number };
}

const SEED: Row[] = [
  { id: 1, service: 'billing-api', region: 'EMEA', units: 30, revenue: { q1: 300 } },
  { id: 2, service: 'auth-gateway', region: 'APAC', units: 10, revenue: { q1: 100 } },
  { id: 3, service: 'edge-cache', region: 'EMEA', units: 20, revenue: { q1: 200 } },
  { id: 4, service: 'search-index', region: 'AMER', units: 40, revenue: { q1: 400 } }
];

/** Fresh row objects per test — the editing specs write through to them. */
const makeRows = (): Row[] => SEED.map((row) => ({ ...row, revenue: { ...row.revenue } }));

const COLUMNS: HkColumn<Row>[] = [
  { key: 'service', header: 'Service', sortable: true, filter: 'text' },
  { key: 'region', header: 'Region', sortable: true, filter: 'multiselect' },
  { key: 'units', header: 'Units', sortable: true, numeric: true, aggregate: 'sum', editable: true },
  {
    key: 'revenue',
    header: 'Revenue',
    children: [{ key: 'q1', header: 'Q1', numeric: true, aggregate: 'sum' }]
  }
];

@Component({
  imports: [HkTableComponent, HkTemplate],
  template: `
    <hk-table
      [value]="rows()"
      [columns]="columns"
      dataKey="id"
      [paginator]="paginator()"
      [rows]="pageSize()"
      [selectionMode]="selectionMode()"
      [(selection)]="selection"
      [showIndex]="showIndex()"
      [rowExpansion]="expansion()"
      [groupRowsBy]="groupBy()"
      [editMode]="editMode()">
      <ng-template hkTemplate="cell:service" let-value>
        <b class="custom-cell">{{ value }}</b>
      </ng-template>
      <ng-template hkTemplate="expansion" let-row>
        <span class="expansion-body">{{ row.service }} detail</span>
      </ng-template>
    </hk-table>
  `
})
class HostComponent {
  readonly table = viewChild.required(HkTableComponent);
  readonly columns = COLUMNS;
  readonly rows = signal<Row[]>(makeRows());
  readonly selection = signal<Row[]>([]);
  readonly paginator = signal(false);
  readonly pageSize = signal(10);
  readonly selectionMode = signal<'single' | 'multiple' | 'checkbox' | null>(null);
  readonly showIndex = signal(false);
  readonly expansion = signal(false);
  readonly groupBy = signal('');
  readonly editMode = signal<'cell' | 'row' | null>(null);
}

@Component({
  imports: [HkTableComponent],
  template: `<hk-table [value]="rows" [columns]="columns" dataKey="id" sortMode="multiple" />`
})
class MultiSortHost {
  readonly table = viewChild.required(HkTableComponent);
  readonly columns = COLUMNS;
  readonly rows = makeRows();
}

describe('HkTableComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  /** Text of every body cell, row by row. */
  const bodyText = (): string[][] =>
    fixture.debugElement
      .queryAll(By.css('tbody tr.hk-row'))
      .map((row) => row.queryAll(By.css('td')).map((cell) => cell.nativeElement.textContent.trim()));

  const column = (index: number): string[] => bodyText().map((row) => row[index]);

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent, MultiSortHost] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('rendering', () => {
    it('renders one body row per record', () => {
      expect(bodyText().length).toBe(4);
    });

    it('builds a header row per level of the column tree', () => {
      const headerRows = fixture.debugElement.queryAll(By.css('thead tr'));
      expect(headerRows.length).toBe(2);
    });

    it('spans a group header across its leaves and stretches the leaves down', () => {
      const group = fixture.debugElement.queryAll(By.css('thead tr:first-child th'))[3];
      expect(group.nativeElement.getAttribute('colspan')).toBe('1');
      expect(group.nativeElement.textContent.trim()).toBe('Revenue');

      const first = fixture.debugElement.query(By.css('thead tr:first-child th'));
      expect(first.nativeElement.getAttribute('rowspan')).toBe('2');
    });

    it('reads a nested field through its dotted path', () => {
      expect(column(3)).toEqual(['300', '100', '200', '400']);
    });

    it('formats numeric columns with digit grouping', () => {
      host.rows.set([{ id: 9, service: 'x', region: 'EMEA', units: 12345, revenue: { q1: 1 } }]);
      fixture.detectChanges();
      expect(column(2)[0]).toBe('12,345');
    });

    it('uses a named cell template when the key matches', () => {
      const custom = fixture.debugElement.queryAll(By.css('.custom-cell'));
      expect(custom.length).toBe(4);
      expect(custom[0].nativeElement.textContent).toBe('billing-api');
    });

    it('shows the empty message when nothing matches', () => {
      host.rows.set([]);
      fixture.detectChanges();
      expect(fixture.debugElement.query(By.css('.hk-empty'))).toBeTruthy();
    });
  });

  describe('sorting', () => {
    it('cycles ascending, descending, then off', () => {
      const table = host.table();
      const leaf = table.leaves()[2];

      table.toggleSort(leaf);
      fixture.detectChanges();
      expect(column(2)).toEqual(['10', '20', '30', '40']);

      table.toggleSort(leaf);
      fixture.detectChanges();
      expect(column(2)).toEqual(['40', '30', '20', '10']);

      table.toggleSort(leaf);
      fixture.detectChanges();
      expect(column(2)).toEqual(['30', '10', '20', '40']);
    });

    it('replaces the sort field in single mode', () => {
      const table = host.table();
      table.toggleSort(table.leaves()[2]);
      table.toggleSort(table.leaves()[0]);
      expect(table.sort().length).toBe(1);
      expect(table.sort()[0].field).toBe('service');
    });

    it('stacks fields on shift-click in multiple mode', () => {
      const multi = TestBed.createComponent(MultiSortHost);
      multi.detectChanges();
      const table = multi.componentInstance.table();

      table.toggleSort(table.leaves()[1]);
      table.toggleSort(table.leaves()[2], new MouseEvent('click', { shiftKey: true }));
      expect(table.sort().map((meta) => meta.field)).toEqual(['region', 'units']);
    });

    it('orders by each sort field in turn', () => {
      const multi = TestBed.createComponent(MultiSortHost);
      multi.detectChanges();
      const table = multi.componentInstance.table();

      // Region ascending first, then units descending inside each region.
      table.toggleSort(table.leaves()[1]);
      table.toggleSort(table.leaves()[2], new MouseEvent('click', { shiftKey: true }));
      table.toggleSort(table.leaves()[2], new MouseEvent('click', { shiftKey: true }));
      multi.detectChanges();

      const rows = multi.debugElement
        .queryAll(By.css('tbody tr.hk-row'))
        .map((row) => row.queryAll(By.css('td')).map((cell) => cell.nativeElement.textContent.trim()));
      expect(rows.map((row) => row[1])).toEqual(['AMER', 'APAC', 'EMEA', 'EMEA']);
      expect(rows.map((row) => row[2])).toEqual(['40', '10', '30', '20']);
    });

    it('exposes aria-sort on the sorted header', () => {
      host.table().toggleSort(host.table().leaves()[0]);
      fixture.detectChanges();
      const header = fixture.debugElement.query(By.css('thead th.hk-head-leaf'));
      expect(header.nativeElement.getAttribute('aria-sort')).toBe('ascending');
    });
  });

  describe('filtering', () => {
    it('narrows rows on a column filter', () => {
      const table = host.table();
      table.onColumnFilter(table.leaves()[1], { value: ['EMEA'], matchMode: 'in' });
      fixture.detectChanges();
      expect(column(1)).toEqual(['EMEA', 'EMEA']);
    });

    it('combines two column filters conjunctively', () => {
      const table = host.table();
      table.onColumnFilter(table.leaves()[1], { value: ['EMEA'], matchMode: 'in' });
      table.onColumnFilter(table.leaves()[2], { value: 25, matchMode: 'gt' });
      fixture.detectChanges();
      expect(column(0)).toEqual(['billing-api']);
    });

    it('searches every visible field', () => {
      host.table().globalFilter.set('edge');
      fixture.detectChanges();
      expect(bodyText().length).toBe(1);
    });

    it('clears filters and the search together', () => {
      const table = host.table();
      table.onColumnFilter(table.leaves()[1], { value: ['EMEA'], matchMode: 'in' });
      table.globalFilter.set('edge');
      fixture.detectChanges();
      table.clearFilters();
      fixture.detectChanges();
      expect(bodyText().length).toBe(4);
      expect(table.activeFilterCount()).toBe(0);
    });

    it('resets to the first page when a filter changes', () => {
      host.paginator.set(true);
      host.pageSize.set(2);
      fixture.detectChanges();
      host.table().first.set(2);
      host.table().onColumnFilter(host.table().leaves()[1], { value: ['EMEA'], matchMode: 'in' });
      expect(host.table().first()).toBe(0);
    });
  });

  describe('paging', () => {
    beforeEach(() => {
      host.paginator.set(true);
      host.pageSize.set(2);
      fixture.detectChanges();
    });

    it('renders only the current page', () => {
      expect(bodyText().length).toBe(2);
      expect(column(0)).toEqual(['billing-api', 'auth-gateway']);
    });

    it('moves to the next page', () => {
      host.table().onPage({ first: 2, rows: 2 });
      fixture.detectChanges();
      expect(column(0)).toEqual(['edge-cache', 'search-index']);
    });

    it('keeps the serial number continuous across pages', () => {
      host.showIndex.set(true);
      host.table().onPage({ first: 2, rows: 2 });
      fixture.detectChanges();
      expect(column(0)).toEqual(['3', '4']);
    });
  });

  describe('selection', () => {
    it('replaces the selection in single mode', () => {
      host.selectionMode.set('single');
      fixture.detectChanges();
      const table = host.table();
      table.toggleRowSelection(table.renderRows()[0]);
      table.toggleRowSelection(table.renderRows()[1]);
      expect(host.selection().map((row) => row.id)).toEqual([2]);
    });

    it('accumulates in checkbox mode and toggles back off', () => {
      host.selectionMode.set('checkbox');
      fixture.detectChanges();
      const table = host.table();
      table.toggleRowSelection(table.renderRows()[0], true);
      table.toggleRowSelection(table.renderRows()[1], true);
      expect(host.selection().length).toBe(2);

      table.toggleRowSelection(table.renderRows()[0], true);
      expect(host.selection().map((row) => row.id)).toEqual([2]);
    });

    it('select-all covers the page and clears again', () => {
      host.selectionMode.set('checkbox');
      fixture.detectChanges();
      const table = host.table();
      table.toggleSelectAllOnPage();
      expect(host.selection().length).toBe(4);
      expect(table.allPageSelected()).toBeTrue();

      table.toggleSelectAllOnPage();
      expect(host.selection().length).toBe(0);
    });

    it('reports a partial page selection as indeterminate', () => {
      host.selectionMode.set('checkbox');
      fixture.detectChanges();
      const table = host.table();
      table.toggleRowSelection(table.renderRows()[0], true);
      expect(table.somePageSelected()).toBeTrue();
      expect(table.allPageSelected()).toBeFalse();
    });

    it('matches selection by dataKey, not by object identity', () => {
      host.selectionMode.set('checkbox');
      fixture.detectChanges();
      host.selection.set([{ ...host.rows()[0] }]);
      fixture.detectChanges();
      expect(host.table().isSelected(host.rows()[0])).toBeTrue();
    });
  });

  describe('expansion', () => {
    beforeEach(() => {
      host.expansion.set(true);
      fixture.detectChanges();
    });

    it('renders the detail row only once expanded', () => {
      expect(fixture.debugElement.query(By.css('.expansion-body'))).toBeNull();
      host.table().toggleExpansion(host.table().renderRows()[0]);
      fixture.detectChanges();
      const body = fixture.debugElement.query(By.css('.expansion-body'));
      expect(body.nativeElement.textContent).toBe('billing-api detail');
    });

    it('spans the detail cell across every column', () => {
      const table = host.table();
      table.toggleExpansion(table.renderRows()[0]);
      fixture.detectChanges();
      const cell = fixture.debugElement.query(By.css('.hk-expansion-cell'));
      expect(cell.nativeElement.getAttribute('colspan')).toBe(String(table.totalColumns()));
    });

    it('collapses on a second toggle', () => {
      const table = host.table();
      table.toggleExpansion(table.renderRows()[0]);
      table.toggleExpansion(table.renderRows()[0]);
      fixture.detectChanges();
      expect(fixture.debugElement.query(By.css('.expansion-body'))).toBeNull();
    });
  });

  describe('grouping', () => {
    beforeEach(() => {
      host.groupBy.set('region');
      fixture.detectChanges();
    });

    it('makes each group contiguous and emits a header per group', () => {
      expect(column(1)).toEqual(['EMEA', 'EMEA', 'APAC', 'AMER']);
      expect(fixture.debugElement.queryAll(By.css('tr.hk-group-row')).length).toBe(3);
    });

    it('hides a collapsed group\'s rows but keeps its header', () => {
      const table = host.table();
      const header = table.renderRows().find((render) => render.kind === 'groupHeader')!;
      table.toggleGroup(header);
      fixture.detectChanges();
      expect(bodyText().length).toBe(2);
      expect(fixture.debugElement.queryAll(By.css('tr.hk-group-row')).length).toBe(3);
    });
  });

  describe('footer aggregates', () => {
    it('sums a column across the whole set', () => {
      const footer = fixture.debugElement.queryAll(By.css('tfoot td'));
      expect(footer[2].nativeElement.textContent.trim()).toBe('100');
    });

    it('recomputes over the filtered set, not the page', () => {
      const table = host.table();
      table.onColumnFilter(table.leaves()[1], { value: ['EMEA'], matchMode: 'in' });
      fixture.detectChanges();
      const footer = fixture.debugElement.queryAll(By.css('tfoot td'));
      expect(footer[2].nativeElement.textContent.trim()).toBe('50');
    });
  });

  describe('editing', () => {
    beforeEach(() => {
      host.editMode.set('cell');
      fixture.detectChanges();
    });

    it('swaps in an editor only for the double-clicked cell', () => {
      const table = host.table();
      table.startCellEdit(table.renderRows()[0], table.leaves()[2]);
      fixture.detectChanges();
      expect(fixture.debugElement.queryAll(By.css('input.hk-editor')).length).toBe(1);
    });

    it('writes the committed value back and emits editComplete', () => {
      const table = host.table();
      const events: unknown[] = [];
      table.editComplete.subscribe((event) => events.push(event));

      table.startCellEdit(table.renderRows()[0], table.leaves()[2]);
      fixture.detectChanges();
      const input = fixture.debugElement.query(By.css('input.hk-editor')).nativeElement as HTMLInputElement;
      input.value = '99';
      input.dispatchEvent(new Event('input'));
      input.dispatchEvent(new Event('blur'));
      fixture.detectChanges();

      expect(host.rows()[0].units).toBe(99);
      expect(events.length).toBe(1);
    });

    it('restores the old value on escape', () => {
      const table = host.table();
      table.startCellEdit(table.renderRows()[0], table.leaves()[2]);
      fixture.detectChanges();
      const input = fixture.debugElement.query(By.css('input.hk-editor')).nativeElement as HTMLInputElement;
      input.value = '77';
      input.dispatchEvent(new Event('input'));
      table.onEditorCancel(table.renderRows()[0], table.leaves()[2]);
      fixture.detectChanges();
      expect(host.rows()[0].units).toBe(30);
    });
  });

  describe('column visibility', () => {
    it('drops a hidden column from the header and the body', () => {
      const table = host.table();
      table.toggleColumn('region');
      fixture.detectChanges();
      expect(table.leaves().map((leaf) => leaf.id)).not.toContain('region');
      expect(bodyText()[0].length).toBe(3);
    });

    it('restores everything on showAllColumns', () => {
      const table = host.table();
      table.toggleColumn('region');
      table.showAllColumns();
      fixture.detectChanges();
      expect(bodyText()[0].length).toBe(4);
    });
  });

  describe('lazy mode', () => {
    it('emits an initial load and leaves the rows untouched', () => {
      TestBed.resetTestingModule();

      @Component({
        imports: [HkTableComponent],
        template: `
          <hk-table [value]="rows" [columns]="columns" [lazy]="true" [totalRecords]="97"
            [paginator]="true" [rows]="2" (lazyLoad)="events.push($event)" />
        `
      })
      class LazyHost {
        readonly table = viewChild.required(HkTableComponent);
        readonly columns = COLUMNS;
        readonly rows = makeRows().slice(0, 2);
        readonly events: unknown[] = [];
      }

      const lazyFixture = TestBed.createComponent(LazyHost);
      lazyFixture.detectChanges();
      const lazyHost = lazyFixture.componentInstance;

      expect(lazyHost.events.length).toBe(1);
      expect((lazyHost.events[0] as { trigger: string }).trigger).toBe('init');
      // Server owns the slicing; the grid must not re-page what it was given.
      expect(lazyFixture.debugElement.queryAll(By.css('tbody tr.hk-row')).length).toBe(2);
      expect(lazyHost.table().recordCount()).toBe(97);
    });
  });

  describe('reset', () => {
    it('clears sort, filters and paging in one call', () => {
      const table = host.table();
      table.toggleSort(table.leaves()[0]);
      table.onColumnFilter(table.leaves()[1], { value: ['EMEA'], matchMode: 'in' });
      table.toggleColumn('units');
      table.reset();
      fixture.detectChanges();

      expect(table.sort().length).toBe(0);
      expect(table.activeFilterCount()).toBe(0);
      expect(bodyText().length).toBe(4);
    });
  });
});
