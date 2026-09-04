import {
  Component,
  DestroyRef,
  ElementRef,
  ViewEncapsulation,
  effect,
  inject,
  signal,
  untracked,
  viewChild
} from '@angular/core';
import { ChatPanelComponent } from '../../demos/chatbot-demo/chat-panel.component';
import { ChatLauncherService } from '../../services/chat-launcher.service';

/**
 * The launcher variant of the chatbot: a round button in the corner that opens
 * the same panel in a docked card.
 *
 * Mounted once at the app shell so it can ride any route, but it renders
 * nothing until something enables it — this is a demo of a docked assistant,
 * not a support widget the site offers, and a floating chat button on every
 * docs page would claim otherwise. The panel is built only on first open, so
 * an assistant nobody asked for costs no transcript and no speech handle.
 */
@Component({
  selector: 'app-chat-launcher',
  imports: [ChatPanelComponent],
  templateUrl: './chat-launcher.component.html',
  styleUrl: './chat-launcher.component.css',
  // The panel's styles are component-scoped to the chat panel; this shell is
  // its own thing and keeps the default encapsulation.
  encapsulation: ViewEncapsulation.Emulated
})
export class ChatLauncherComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly launcher = inject(ChatLauncherService);
  private readonly panelEl = viewChild<ElementRef<HTMLElement>>('panelEl');
  private readonly buttonEl = viewChild<ElementRef<HTMLButtonElement>>('buttonEl');
  private readonly chat = viewChild(ChatPanelComponent);

  /** Read straight off the service — the template renders nothing when off. */
  readonly enabled = this.launcher.enabled;

  readonly open = signal(false);
  /** Stays true once opened, so closing does not tear down the transcript. */
  readonly everOpened = signal(false);

  readonly suggestions = [
    'What can you do?',
    'Weather in Bergen',
    'Calculate (12 + 8) * 3'
  ];

  constructor() {
    // Anything on the page can ask for the launcher — the chatbot docs page
    // uses this so its "Launcher" variant demonstrates the real thing rather
    // than a second copy of the panel inline.
    //
    // These read a *counter* and must act only when it moves. An effect also
    // runs once when it is created, so without the first-run guard the
    // launcher opened itself on every page load — including during prerender,
    // which baked the button into all 79 static pages.
    let firstOpen = true;
    effect(() => {
      this.launcher.openSignal();
      untracked(() => {
        if (firstOpen) {
          firstOpen = false;
          return;
        }
        // An open request implies the button should exist — otherwise a
        // caller could open a panel with no way to close it back down to.
        this.launcher.enable();
        this.openPanel();
      });
    });

    let firstClose = true;
    effect(() => {
      this.launcher.closeSignal();
      untracked(() => {
        if (firstClose) {
          firstClose = false;
          return;
        }
        if (this.open()) this.close();
      });
    });

    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape' && this.open()) this.close();
    };
    if (typeof document !== 'undefined') {
      document.addEventListener('keydown', onKey);
      this.destroyRef.onDestroy(() => document.removeEventListener('keydown', onKey));
    }
  }

  toggle(): void {
    if (this.open()) this.close();
    else this.openPanel();
  }

  private openPanel(): void {
    this.open.set(true);
    this.launcher.isOpen.set(true);
    this.everOpened.set(true);
    // Focus the composer, not the panel: the first thing anyone wants to do
    // here is type.
    queueMicrotask(() => this.chat()?.focusComposer());
  }

  close(): void {
    this.open.set(false);
    this.launcher.isOpen.set(false);
    // Focus goes back where it came from, or it lands on <body> and the next
    // Tab starts from the top of the page.
    this.buttonEl()?.nativeElement.focus();
  }

  /** Keeps Tab inside the open card, the way a dialog has to. */
  onPanelKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Tab') return;
    const root = this.panelEl()?.nativeElement;
    if (!root) return;

    const focusable = root.querySelectorAll<HTMLElement>(
      'button:not([disabled]), textarea, input, a[href], [tabindex]:not([tabindex="-1"])'
    );
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
}
