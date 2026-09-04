import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

/** Initials fallback, status ring and a stack that collapses with a +N. */
@Component({
  selector: 'app-avatar-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="w-full max-w-sm space-y-5">
      <div class="flex items-center gap-4">
        @for (person of people; track person.name) {
          <span class="relative inline-block">
            <span class="grid h-11 w-11 place-items-center rounded-full text-xs font-bold text-slate-900 dark:text-white"
              [class]="person.skin">{{ initials(person.name) }}</span>
            @if (person.online) {
              <span class="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-black"></span>
            }
          </span>
        }
      </div>

      <div class="flex items-center">
        @for (person of people.slice(0, shown()); track person.name) {
          <span class="-ml-2 grid h-9 w-9 place-items-center rounded-full text-[0.72rem] font-bold text-slate-900 dark:text-white ring-2 ring-white dark:ring-black first:ml-0"
            [class]="person.skin">{{ initials(person.name) }}</span>
        }
        @if (people.length > shown()) {
          <button type="button" (click)="shown.set(people.length)"
            class="-ml-2 grid h-9 w-9 place-items-center rounded-full bg-slate-200 dark:bg-white/10 text-[0.72rem] font-bold text-slate-700 dark:text-gray-300 ring-2 ring-white dark:ring-black">
            +{{ people.length - shown() }}
          </button>
        }
      </div>
      <p class="text-xs text-slate-600 dark:text-gray-400">{{ people.length }} people on call this week.</p>
    </div>
  `
})
export class AvatarDemoComponent {
  readonly people = [
    { name: 'Debashish Roy', online: true, skin: 'bg-gradient-to-br from-red-600 to-red-900' },
    { name: 'Aisha Khan', online: true, skin: 'bg-gradient-to-br from-amber-600 to-amber-900' },
    { name: 'Marco Silva', online: false, skin: 'bg-gradient-to-br from-sky-600 to-sky-900' },
    { name: 'Lena Fischer', online: false, skin: 'bg-gradient-to-br from-emerald-600 to-emerald-900' },
    { name: 'Yuki Tanaka', online: true, skin: 'bg-gradient-to-br from-violet-600 to-violet-900' }
  ];

  readonly shown = signal(3);

  initials(name: string): string {
    return name.split(' ').map((part) => part[0]).join('').slice(0, 2);
  }
}
