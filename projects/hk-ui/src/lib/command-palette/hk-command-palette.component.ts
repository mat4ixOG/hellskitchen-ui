import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  PLATFORM_ID,
  afterNextRender,
  computed,
  effect,
  inject,
  input,
  model,
  output,
  signal,
  viewChild
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export interface HkCommandPaletteItem {
  label: string;
  group: string;
  /** Shortcut shown on the right. */
  hint?: string;
}

let nextPaletteId = 0;

/**
 * Fuzzy-matched command list. Matching is subsequence-based, so "dbi" still
 * finds "Deploy billing-api". Renders in place while `open`; position it
 * (or wrap it in your own overlay) wherever it should appear.
 */
@Component({
  selector: 'hk-command-palette, hk-command',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './hk-command-palette.component.html',
  styleUrl: './hk-command-palette.component.css',
  host: {
    '(keydown)': 'onKey($event)'
  }
})
export class HkCommandPaletteComponent {
  readonly open = model(false);
  readonly commands = input<HkCommandPaletteItem[]>([]);
  /** Global shortcut that opens the palette. `mod` is Cmd on macOS, Ctrl elsewhere. */
  readonly hotkey = input('mod+k');
  readonly placeholder = input('Type a command…');

  /** Emits the chosen command. */
  readonly run = output<HkCommandPaletteItem>();

  readonly query = signal('');
  readonly cursor = signal(0);
  readonly baseId = `hk-command-${nextPaletteId++}`;

  private readonly field = viewChild<ElementRef<HTMLInputElement>>('field');
  private returnFocus: HTMLElement | null = null;

  /** Subsequence match, so "dbi" still finds "Deploy billing-api". */
  readonly matches = computed(() => {
    const query = this.query().toLowerCase().replace(/\s/g, '');
    const commands = this.commands();
    if (!query) return commands;
    return commands.filter((command) => {
      const haystack = command.label.toLowerCase();
      let cursor = 0;
      for (const char of query) {
        cursor = haystack.indexOf(char, cursor) + 1;
        if (cursor === 0) return false;
      }
      return true;
    });
  });

  readonly grouped = computed(() => {
    const groups = new Map<string, HkCommandPaletteItem[]>();
    for (const command of this.matches()) {
      const bucket = groups.get(command.group);
      if (bucket) bucket.push(command);
      else groups.set(command.group, [command]);
    }
    return [...groups].map(([name, items]) => ({ name, items }));
  });

  readonly activeId = computed(() =>
    this.matches().length ? `${this.baseId}-option-${this.cursor()}` : null
  );

  constructor() {
    const browser = isPlatformBrowser(inject(PLATFORM_ID));
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      const onKey = (event: KeyboardEvent): void => {
        if (!this.matchesHotkey(event)) return;
        event.preventDefault();
        if (!this.open()) this.open.set(true);
        else this.field()?.nativeElement.focus();
      };
      document.addEventListener('keydown', onKey);
      destroyRef.onDestroy(() => document.removeEventListener('keydown', onKey));
    });

    // Focus moves in when the palette opens and back out when it closes.
    // Opening on first render does not steal focus from the page.
    let wasOpen = this.open();
    effect(() => {
      const open = this.open();
      if (!browser || open === wasOpen) return;
      wasOpen = open;
      if (open) {
        this.returnFocus = document.activeElement as HTMLElement | null;
        this.cursor.set(0);
        setTimeout(() => this.field()?.nativeElement.focus());
      } else {
        this.returnFocus?.focus?.();
        this.returnFocus = null;
      }
    });
  }

  indexOf(command: HkCommandPaletteItem): number {
    return this.matches().indexOf(command);
  }

  onQuery(value: string): void {
    this.query.set(value);
    this.cursor.set(0);
  }

  onKey(event: KeyboardEvent): void {
    if (!this.open()) return;
    const last = this.matches().length - 1;
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (last >= 0) this.cursor.set(this.cursor() >= last ? 0 : this.cursor() + 1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (last >= 0) this.cursor.set(this.cursor() <= 0 ? last : this.cursor() - 1);
        break;
      case 'Enter': {
        const command = this.matches()[this.cursor()];
        if (command) {
          event.preventDefault();
          this.choose(command);
        }
        break;
      }
      case 'Escape':
        event.preventDefault();
        this.open.set(false);
        break;
    }
  }

  choose(command: HkCommandPaletteItem): void {
    this.run.emit(command);
    this.query.set('');
    this.cursor.set(0);
  }

  private matchesHotkey(event: KeyboardEvent): boolean {
    const parts = this.hotkey().toLowerCase().split('+').map((part) => part.trim());
    const key = parts.pop();
    if (!key || event.key.toLowerCase() !== key) return false;
    const wants = (name: string): boolean => parts.includes(name);
    const mod = wants('mod');
    if (mod && !(event.metaKey || event.ctrlKey)) return false;
    if (!mod && wants('ctrl') !== event.ctrlKey) return false;
    if (!mod && wants('meta') !== event.metaKey) return false;
    if (wants('shift') !== event.shiftKey) return false;
    if (wants('alt') !== event.altKey) return false;
    return true;
  }
}
