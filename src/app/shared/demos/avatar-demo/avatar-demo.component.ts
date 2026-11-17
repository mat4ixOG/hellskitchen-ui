import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HkAvatarComponent, HkAvatarStackComponent } from 'hellskitchen-ui';

/** Initials fallback, status ring and a stack that collapses with a +N. */
@Component({
  selector: 'app-avatar-demo',
  imports: [HkAvatarComponent, HkAvatarStackComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="w-full max-w-sm space-y-5">
      <div class="flex items-center gap-4">
        @for (person of people; track person.name) {
          <hk-avatar [name]="person.name" [online]="person.online" [style.--hk-avatar-bg]="person.bg" />
        }
      </div>

      <hk-avatar-stack [max]="3">
        @for (person of people; track person.name) {
          <hk-avatar size="sm" [name]="person.name" [style.--hk-avatar-bg]="person.bg" />
        }
      </hk-avatar-stack>
      <p class="text-xs text-slate-600 dark:text-gray-400">{{ people.length }} people on call this week.</p>
    </div>
  `
})
export class AvatarDemoComponent {
  readonly people = [
    { name: 'Debashish Roy', online: true, bg: 'linear-gradient(to bottom right, #dc2626, #7f1d1d)' },
    { name: 'Aisha Khan', online: true, bg: 'linear-gradient(to bottom right, #d97706, #78350f)' },
    { name: 'Marco Silva', online: false, bg: 'linear-gradient(to bottom right, #0284c7, #0c4a6e)' },
    { name: 'Lena Fischer', online: false, bg: 'linear-gradient(to bottom right, #059669, #064e3b)' },
    { name: 'Yuki Tanaka', online: true, bg: 'linear-gradient(to bottom right, #7c3aed, #4c1d95)' }
  ];
}
