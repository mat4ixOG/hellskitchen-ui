import { Component, DestroyRef, inject, signal } from '@angular/core';
import { RevealDirective } from '../../../../shared/directives/reveal.directive';

@Component({
  selector: 'app-hero',
  imports: [RevealDirective],
  templateUrl: './hero.component.html',
  styleUrl: './hero.component.css'
})
export class HeroComponent {
  /**
   * Drop any mp4 at `public/videos/hero.mp4` and it plays behind the hero.
   * If the file isn't there the animated gradient/grid backdrop shows instead.
   */
  readonly videoSrc = 'videos/hero.mp4';
  readonly videoFailed = signal(false);

  readonly installCommand = 'npm i hellskitchen-ui';
  readonly copied = signal(false);

  /** Cycled through in the headline. */
  private readonly words = ['configurable', 'animated', 'accessible', 'tiny', 'free'];
  readonly wordIndex = signal(0);

  readonly badges = ['Angular 19+', 'Standalone', 'Signals', 'Zero deps', 'MIT'];

  constructor() {
    const rotate = setInterval(() => {
      this.wordIndex.update((i) => (i + 1) % this.words.length);
    }, 2400);

    inject(DestroyRef).onDestroy(() => clearInterval(rotate));
  }

  get word(): string {
    return this.words[this.wordIndex()];
  }

  async copyInstall(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.installCommand);
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 1800);
    } catch {
      // Clipboard is blocked on insecure origins — leave the text selectable.
      this.copied.set(false);
    }
  }
}
