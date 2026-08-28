import { Directive, ElementRef, HostListener, inject, input } from '@angular/core';

/**
 * Subtle pointer-follow tilt for cards. Also exposes the cursor position as
 * `--mx` / `--my` custom properties so a card can render a spotlight glow.
 */
@Directive({
  selector: '[appTilt]',
  standalone: true
})
export class TiltDirective {
  /** Maximum rotation in degrees. */
  readonly tiltMax = input(6);

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  @HostListener('pointermove', ['$event'])
  onMove(event: PointerEvent): void {
    const el = this.host.nativeElement;
    const rect = el.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width;
    const py = (event.clientY - rect.top) / rect.height;
    const max = this.tiltMax();

    el.style.setProperty('--mx', `${px * 100}%`);
    el.style.setProperty('--my', `${py * 100}%`);
    el.style.transform =
      `perspective(900px) rotateX(${(0.5 - py) * max}deg) rotateY(${(px - 0.5) * max}deg)`;
  }

  @HostListener('pointerleave')
  onLeave(): void {
    this.host.nativeElement.style.transform = '';
  }
}
