import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  input,
  model,
  signal
} from '@angular/core';

export interface HkTreeNode {
  /** Stable id used by `checked` / `expanded`. Falls back to `label`. */
  id?: string;
  label: string;
  children?: HkTreeNode[];
  /** With `loadChildren` set, marks a node whose children are fetched on first expand. */
  hasChildren?: boolean;
}

export type HkTreeCheckState = 'all' | 'some' | 'none';

interface HkTreeRow {
  node: HkTreeNode;
  id: string;
  level: number;
  parent: string | null;
}

/**
 * Expandable tree with a checkbox cascade that reports partial state: a parent
 * is checked, unchecked or mixed based on its children, not on its own flag.
 */
@Component({
  selector: 'hk-tree',
  standalone: true,
  imports: [NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './hk-tree.component.html',
  styleUrl: './hk-tree.component.css'
})
export class HkTreeComponent {
  readonly nodes = input<HkTreeNode[]>([]);
  /** Checked node ids. Two-way bindable; emits `checkedChange`. */
  readonly checked = model<string[]>([]);
  /** Expanded node ids. Two-way bindable. */
  readonly expanded = model<string[]>([]);
  /** Checking a parent checks its whole subtree. */
  readonly cascade = input(true);
  /** Lazy loader, called the first time a node without children expands. */
  readonly loadChildren = input<((node: HkTreeNode) => Promise<HkTreeNode[]>) | null>(null);

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly loaded = signal<Record<string, HkTreeNode[]>>({});
  private readonly loading = signal<string[]>([]);
  readonly focused = signal<string | null>(null);

  /** Every node currently on screen, in reading order — what the arrows walk. */
  readonly rows = computed(() => {
    const out: HkTreeRow[] = [];
    const walk = (list: HkTreeNode[], level: number, parent: string | null): void => {
      for (const node of list) {
        const id = this.idOf(node);
        out.push({ node, id, level, parent });
        if (this.isOpen(node)) walk(this.childrenOf(node) ?? [], level + 1, id);
      }
    };
    walk(this.nodes(), 1, null);
    return out;
  });

  /** The one tabbable item: the focused one, else the first. */
  readonly tabStop = computed(() => {
    const rows = this.rows();
    const focused = this.focused();
    return rows.some((row) => row.id === focused) ? focused : rows[0]?.id ?? null;
  });

  idOf(node: HkTreeNode): string {
    return node.id ?? node.label;
  }

  childrenOf(node: HkTreeNode): HkTreeNode[] | undefined {
    return node.children ?? this.loaded()[this.idOf(node)];
  }

  isBranch(node: HkTreeNode): boolean {
    return !!node.children?.length || (!!node.hasChildren && !!this.loadChildren());
  }

  isOpen(node: HkTreeNode): boolean {
    return this.isBranch(node) && this.expanded().includes(this.idOf(node));
  }

  isLoading(node: HkTreeNode): boolean {
    return this.loading().includes(this.idOf(node));
  }

  toggle(node: HkTreeNode): void {
    const id = this.idOf(node);
    const open = this.expanded();
    if (open.includes(id)) {
      this.expanded.set(open.filter((item) => item !== id));
      return;
    }
    this.expanded.set([...open, id]);
    void this.ensureLoaded(node);
  }

  private async ensureLoaded(node: HkTreeNode): Promise<void> {
    const loader = this.loadChildren();
    const id = this.idOf(node);
    if (!loader || node.children || this.loaded()[id] || this.isLoading(node)) return;
    this.loading.update((list) => [...list, id]);
    try {
      const children = await loader(node);
      this.loaded.update((map) => ({ ...map, [id]: children }));
    } finally {
      this.loading.update((list) => list.filter((item) => item !== id));
    }
  }

  /** Leaf ids under a node — what a cascading parent stands for. */
  private leaves(node: HkTreeNode): string[] {
    const children = this.childrenOf(node);
    if (!children?.length) return [this.idOf(node)];
    return children.flatMap((child) => this.leaves(child));
  }

  /** A parent reports all / some / none from its children, not its own flag. */
  state(node: HkTreeNode): HkTreeCheckState {
    const picked = this.checked();
    const children = this.childrenOf(node);
    if (!this.cascade() || !children?.length) {
      return picked.includes(this.idOf(node)) ? 'all' : 'none';
    }
    const leaves = this.leaves(node);
    const hits = leaves.filter((id) => picked.includes(id)).length;
    if (hits === 0) return 'none';
    return hits === leaves.length ? 'all' : 'some';
  }

  ariaChecked(node: HkTreeNode): 'true' | 'false' | 'mixed' {
    const state = this.state(node);
    return state === 'all' ? 'true' : state === 'some' ? 'mixed' : 'false';
  }

  check(node: HkTreeNode): void {
    const ids = this.cascade() ? this.leaves(node) : [this.idOf(node)];
    const current = this.checked();
    const allOn = ids.every((id) => current.includes(id));
    this.checked.set(
      allOn
        ? current.filter((id) => !ids.includes(id))
        : [...current, ...ids.filter((id) => !current.includes(id))]
    );
  }

  // ── Keyboard ────────────────────────────────────────────────
  onKeydown(event: KeyboardEvent): void {
    const rows = this.rows();
    const index = rows.findIndex((row) => row.id === this.tabStop());
    const row = rows[index];
    if (!row) return;

    switch (event.key) {
      case 'ArrowDown':
        this.moveTo(rows[index + 1]);
        break;
      case 'ArrowUp':
        this.moveTo(rows[index - 1]);
        break;
      case 'ArrowRight':
        if (!this.isBranch(row.node)) break;
        if (!this.isOpen(row.node)) this.toggle(row.node);
        else if (rows[index + 1]?.parent === row.id) this.moveTo(rows[index + 1]);
        break;
      case 'ArrowLeft':
        if (this.isOpen(row.node)) this.toggle(row.node);
        else this.moveTo(rows.find((item) => item.id === row.parent));
        break;
      case ' ':
        this.check(row.node);
        break;
      default:
        return;
    }
    event.preventDefault();
  }

  private moveTo(row: HkTreeRow | undefined): void {
    if (!row) return;
    this.focused.set(row.id);
    const items = this.host.nativeElement.querySelectorAll<HTMLElement>('[role="treeitem"]');
    for (const item of Array.from(items)) {
      if (item.dataset['id'] === row.id) {
        item.focus();
        break;
      }
    }
  }
}
