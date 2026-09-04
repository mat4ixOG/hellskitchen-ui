import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { HkThemeService } from '../../services/theme.service';

/** The one control that flips the whole token layer. */
@Component({
  selector: 'app-theme-toggle',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button type="button" (click)="theme.toggle()"
      class="group relative grid h-9 w-9 place-items-center rounded-lg border border-slate-200 dark:border-white/10
             bg-slate-50 dark:bg-white/[0.03] text-slate-600 dark:text-gray-400 transition
             hover:border-red-400 dark:hover:border-red-600/50 hover:text-red-700 dark:hover:text-red-400
             cursor-pointer"
      [attr.aria-label]="label()" [attr.title]="label()" [attr.aria-pressed]="isDark()">
      <!-- Both icons stay mounted; only one is scaled in, so the swap animates
           instead of popping. -->
      <i class="pi pi-sun absolute text-sm transition-all duration-300"
        [class]="isDark() ? 'scale-0 -rotate-90 opacity-0' : 'scale-100 rotate-0 opacity-100'"></i>
      <i class="pi pi-moon absolute text-sm transition-all duration-300"
        [class]="isDark() ? 'scale-100 rotate-0 opacity-100' : 'scale-0 rotate-90 opacity-0'"></i>
    </button>
  `
})
export class ThemeToggleComponent {
  readonly theme = inject(HkThemeService);
  readonly isDark = computed(() => this.theme.theme() === 'dark');
  readonly label = computed(() => (this.isDark() ? 'Switch to light theme' : 'Switch to dark theme'));
}
