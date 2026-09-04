import { Component, ElementRef, signal, viewChild } from '@angular/core';
import { RevealDirective } from '../../../../shared/directives/reveal.directive';

interface Reel {
  id: string;
  label: string;
  caption: string;
  /** Relative path under public/ — see public/videos/README.md. */
  src: string;
  poster: string;
}

@Component({
  selector: 'app-motion',
  imports: [RevealDirective],
  templateUrl: './motion.component.html',
  styleUrl: './motion.component.css'
})
export class MotionComponent {
  private readonly player = viewChild<ElementRef<HTMLVideoElement>>('player');

  readonly reels: Reel[] = [
    {
      id: 'overview',
      label: 'The 60-second tour',
      caption: 'Install, import one component, ship.',
      src: 'videos/reel-overview.mp4',
      poster: 'videos/reel-overview.jpg'
    },
    {
      id: 'motion',
      label: 'Motion system',
      caption: 'Every transition, side by side and slowed down.',
      src: 'videos/reel-motion.mp4',
      poster: 'videos/reel-motion.jpg'
    },
    {
      id: 'theming',
      label: 'Retheming live',
      caption: 'One token file, three completely different looks.',
      src: 'videos/reel-theming.mp4',
      poster: 'videos/reel-theming.jpg'
    }
  ];

  readonly activeIndex = signal(0);
  readonly playing = signal(false);
  /** Flipped when the mp4 is missing so the poster/placeholder shows instead. */
  readonly missing = signal(false);

  get active(): Reel {
    return this.reels[this.activeIndex()];
  }

  choose(index: number): void {
    this.activeIndex.set(index);
    this.missing.set(false);
    this.playing.set(false);
  }

  toggle(): void {
    const video = this.player()?.nativeElement;
    if (!video) return;

    if (video.paused) {
      void video.play().then(() => this.playing.set(true)).catch(() => this.missing.set(true));
    } else {
      video.pause();
      this.playing.set(false);
    }
  }
}
