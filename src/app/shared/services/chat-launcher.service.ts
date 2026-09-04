import { Injectable, signal } from '@angular/core';

/**
 * The handle anything on the page has on the corner launcher.
 *
 * The launcher lives in the app shell and the docs demo lives several routes
 * down, so they cannot talk through inputs. A counter rather than a boolean:
 * the demo asks to open it *again* even when it is already open, and a
 * boolean that is already true would emit nothing.
 */
@Injectable({ providedIn: 'root' })
export class ChatLauncherService {
  private readonly openRequests = signal(0);
  private readonly closeRequests = signal(0);

  /** Read by the launcher; each change is one request. */
  readonly openSignal = this.openRequests.asReadonly();
  readonly closeSignal = this.closeRequests.asReadonly();

  /** True while the launcher is showing, so callers can label a toggle. */
  readonly isOpen = signal(false);

  /**
   * Whether the corner button exists at all.
   *
   * Off by default, and deliberately: the launcher is a *demo* of a docked
   * assistant, not a support widget this site offers. A floating button on
   * every page reads as the latter, and a docs site that appears to want to
   * chat with you while you are reading an API table is the wrong impression
   * entirely. The chatbot page's "Launcher" variant turns it on; leaving that
   * page turns it back off.
   */
  readonly enabled = signal(false);

  enable(): void {
    this.enabled.set(true);
  }

  disable(): void {
    this.close();
    this.enabled.set(false);
  }

  open(): void {
    this.openRequests.update((count) => count + 1);
  }

  close(): void {
    this.closeRequests.update((count) => count + 1);
  }
}
