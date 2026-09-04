import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';

interface Command {
  label: string;
  group: string;
  hint?: string;
}

/** Fuzzy-matched command list with grouped results and arrow-key selection. */
@Component({
  selector: 'app-command-palette-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(keydown)': 'onKey($event)' },
  template: `
    <div class="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10 bg-white/95 dark:bg-neutral-950/95 shadow-2xl shadow-slate-900/10 dark:shadow-black/60">
      <div class="flex items-center gap-2.5 border-b border-slate-200 dark:border-white/10 px-4 py-3">
        <span class="text-slate-600 dark:text-gray-400">⌘</span>
        <input autofocus placeholder="Type a command or search…"
          class="flex-1 bg-transparent text-sm text-slate-900 dark:text-white outline-none placeholder:text-slate-400 dark:placeholder:text-gray-500"
          [value]="query()" (input)="onQuery($any($event.target).value)" aria-label="Command" />
        <kbd class="rounded border border-slate-200 dark:border-white/10 px-1.5 py-0.5 text-[0.72rem] text-slate-600 dark:text-gray-400">ESC</kbd>
      </div>

      <ul class="max-h-56 overflow-auto p-1.5">
        @for (group of grouped(); track group.name) {
          <li class="px-2 pb-1 pt-2 text-[0.72rem] font-semibold uppercase tracking-wider text-slate-600 dark:text-gray-400">
            {{ group.name }}
          </li>
          @for (command of group.items; track command.label) {
            <li>
              <button type="button" (click)="run(command)" (mouseenter)="cursor.set(indexOf(command))"
                class="flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-colors"
                [class]="indexOf(command) === cursor() ? 'bg-red-100 dark:bg-red-950/60 text-slate-900 dark:text-white' : 'text-slate-700 dark:text-gray-300'">
                <span>{{ command.label }}</span>
                @if (command.hint) {
                  <kbd class="rounded border border-slate-200 dark:border-white/10 px-1.5 text-[0.72rem] text-slate-600 dark:text-gray-400">{{ command.hint }}</kbd>
                }
              </button>
            </li>
          }
        } @empty {
          <li class="px-3 py-6 text-center text-xs text-slate-600 dark:text-gray-400">Nothing matches “{{ query() }}”</li>
        }
      </ul>

      @if (ran()) {
        <p class="border-t border-slate-200 dark:border-white/10 px-4 py-2 text-xs text-emerald-600 dark:text-emerald-400">Ran: {{ ran() }}</p>
      }
    </div>
  `
})
export class CommandPaletteDemoComponent {
  private readonly commands: Command[] = [
    { label: 'Deploy billing-api', group: 'Actions', hint: '⌘⏎' },
    { label: 'Roll back last deploy', group: 'Actions' },
    { label: 'Open incident channel', group: 'Actions' },
    { label: 'Go to Services', group: 'Navigate', hint: 'G S' },
    { label: 'Go to Deploys', group: 'Navigate', hint: 'G D' },
    { label: 'Toggle dark mode', group: 'Preferences' },
    { label: 'Change accent colour', group: 'Preferences' }
  ];

  readonly query = signal('');
  readonly cursor = signal(0);
  readonly ran = signal('');

  /** Subsequence match, so "dbi" still finds "Deploy billing-api". */
  readonly matches = computed(() => {
    const query = this.query().toLowerCase().replace(/\s/g, '');
    if (!query) return this.commands;
    return this.commands.filter((command) => {
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
    const groups = new Map<string, Command[]>();
    for (const command of this.matches()) {
      const bucket = groups.get(command.group);
      if (bucket) bucket.push(command);
      else groups.set(command.group, [command]);
    }
    return [...groups].map(([name, items]) => ({ name, items }));
  });

  indexOf(command: Command): number {
    return this.matches().indexOf(command);
  }

  onQuery(value: string): void {
    this.query.set(value);
    this.cursor.set(0);
  }

  onKey(event: KeyboardEvent): void {
    const last = this.matches().length - 1;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.cursor.set(this.cursor() === last ? 0 : this.cursor() + 1);
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.cursor.set(this.cursor() === 0 ? last : this.cursor() - 1);
    }
    if (event.key === 'Enter') {
      const command = this.matches()[this.cursor()];
      if (command) this.run(command);
    }
  }

  run(command: Command): void {
    this.ran.set(command.label);
    this.query.set('');
  }
}
