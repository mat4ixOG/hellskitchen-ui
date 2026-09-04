import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-rating-demo',
  imports: [],
  templateUrl: './rating-demo.component.html',
  styleUrl: './rating-demo.component.css'
})
export class RatingDemoComponent {
  readonly stars = [1, 2, 3, 4, 5];
  readonly value = signal(4);
  readonly hovered = signal(0);

  onKey(event: KeyboardEvent): void {
    const max = this.stars.length;
    if (event.key === 'ArrowRight') this.value.update((v) => Math.min(v + 1, max));
    else if (event.key === 'ArrowLeft') this.value.update((v) => Math.max(v - 1, 0));
    else if (event.key === 'Home') this.value.set(1);
    else if (event.key === 'End') this.value.set(max);
    else if (event.key === '0') this.value.set(0);
    else return;

    event.preventDefault();
  }
}
