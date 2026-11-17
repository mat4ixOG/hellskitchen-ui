import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { HkTreeComponent, HkTreeNode } from './hk-tree.component';

@Component({
  imports: [HkTreeComponent],
  template: `<hk-tree [nodes]="nodes" [(checked)]="checked" [(expanded)]="expanded" />`
})
class HostComponent {
  readonly nodes: HkTreeNode[] = [
    { label: 'Americas', children: [{ label: 'us-east-1' }, { label: 'us-west-2' }] },
    { label: 'Edge' }
  ];
  checked = ['us-east-1'];
  expanded = ['Americas'];
}

describe('HkTreeComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  const items = (): HTMLElement[] =>
    fixture.debugElement.queryAll(By.css('[role="treeitem"]')).map((d) => d.nativeElement);
  const checkOf = (item: HTMLElement): HTMLButtonElement =>
    item.querySelector('.hk-tree-check') as HTMLButtonElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders expanded children and reports a mixed parent', () => {
    expect(items().length).toBe(4);
    expect(items()[0].getAttribute('aria-checked')).toBe('mixed');
    expect(items()[0].getAttribute('aria-level')).toBe('1');
    expect(items()[1].getAttribute('aria-level')).toBe('2');
  });

  it('cascades a parent check to every child and writes back', () => {
    checkOf(items()[0]).click();
    fixture.detectChanges();
    expect(host.checked.sort()).toEqual(['us-east-1', 'us-west-2']);
    expect(items()[0].getAttribute('aria-checked')).toBe('true');
  });

  it('collapses a node through the toggle', () => {
    (items()[0].querySelector('.hk-tree-toggle') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(host.expanded).toEqual([]);
    expect(items().length).toBe(2);
  });

  it('keeps a single tab stop', () => {
    expect(items().filter((item) => item.tabIndex === 0).length).toBe(1);
  });
});

describe('HkTreeComponent lazy loading', () => {
  @Component({
    imports: [HkTreeComponent],
    template: `<hk-tree [nodes]="nodes" [loadChildren]="load" />`
  })
  class LazyHost {
    readonly nodes: HkTreeNode[] = [{ label: 'Root', hasChildren: true }];
    readonly calls = signal(0);
    load = async (): Promise<HkTreeNode[]> => {
      this.calls.update((n) => n + 1);
      return [{ label: 'Loaded' }];
    };
  }

  it('calls the loader on first expand', async () => {
    const fixture = TestBed.createComponent(LazyHost);
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('.hk-tree-toggle') as HTMLButtonElement).click();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.componentInstance.calls()).toBe(1);
    expect(fixture.nativeElement.textContent).toContain('Loaded');
  });
});
