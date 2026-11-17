import {
  ChangeDetectionStrategy,
  Component,
  InjectionToken,
  Signal,
  computed,
  inject,
  input,
  signal
} from '@angular/core';

export type HkAvatarSize = 'sm' | 'md' | 'lg';

/** What an avatar needs from the stack it sits in. */
export interface HkAvatarStackRef {
  isHidden(avatar: HkAvatarComponent): boolean;
  readonly stacked: Signal<boolean>;
}

export const HK_AVATAR_STACK = new InjectionToken<HkAvatarStackRef>('HK_AVATAR_STACK');

/**
 * Image, or initials derived from the name when there is no image — or when
 * the image fails, so a missing picture is never a broken one.
 */
@Component({
  selector: 'hk-avatar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="hk-avatar-face" role="img" [attr.aria-label]="name() || null">
      @if (src() && !failed()) {
        <img [src]="src()" alt="" (error)="failed.set(true)" />
      } @else {
        <span aria-hidden="true">{{ initials() }}</span>
      }
    </span>
    @if (online() !== null) {
      @if (online()) {
        <span class="hk-avatar-presence" aria-hidden="true"></span>
      }
      <span class="hk-sr">{{ online() ? 'online' : 'offline' }}</span>
    }
  `,
  styleUrl: './hk-avatar.component.css',
  host: {
    '[attr.data-size]': 'size()',
    '[class.is-stacked]': 'stacked()',
    '[style.display]': 'hiddenInStack() ? "none" : null'
  }
})
export class HkAvatarComponent {
  readonly name = input('');
  readonly src = input('');
  readonly size = input<HkAvatarSize>('md');
  /** Shows a presence dot when set. */
  readonly online = input<boolean | null>(null);

  private readonly stack = inject(HK_AVATAR_STACK, { optional: true });
  readonly failed = signal(false);
  readonly stacked = computed(() => this.stack?.stacked() ?? false);
  readonly hiddenInStack = computed(() => this.stack?.isHidden(this) ?? false);

  readonly initials = computed(() =>
    this.name()
      .split(' ')
      .filter(Boolean)
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
  );
}
