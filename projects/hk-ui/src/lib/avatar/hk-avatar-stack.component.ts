import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChildren,
  input,
  signal
} from '@angular/core';
import { HK_AVATAR_STACK, HkAvatarComponent, HkAvatarStackRef } from './hk-avatar.component';

/** Overlapping avatars that collapse the overflow into a +N button which expands the stack. */
@Component({
  selector: 'hk-avatar-stack',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: HK_AVATAR_STACK, useExisting: HkAvatarStackComponent }],
  template: `
    <ng-content />
    @if (overflow() > 0) {
      <button type="button" class="hk-avatar-more" (click)="expanded.set(true)"
        [attr.aria-label]="'Show ' + overflow() + ' more'">+{{ overflow() }}</button>
    }
  `,
  styleUrl: './hk-avatar-stack.component.css',
  host: { role: 'group' }
})
export class HkAvatarStackComponent implements HkAvatarStackRef {
  /** How many to show before the +N. */
  readonly max = input(3);

  readonly avatars = contentChildren(HkAvatarComponent);
  readonly expanded = signal(false);
  readonly stacked = signal(true).asReadonly();

  readonly shown = computed(() => (this.expanded() ? this.avatars().length : this.max()));
  readonly overflow = computed(() => Math.max(0, this.avatars().length - this.shown()));

  isHidden(avatar: HkAvatarComponent): boolean {
    return this.avatars().indexOf(avatar) >= this.shown();
  }
}
