import { Component, signal } from '@angular/core';
import { HkRatingComponent } from 'hellskitchen-ui';

@Component({
  selector: 'app-rating-demo',
  imports: [HkRatingComponent],
  templateUrl: './rating-demo.component.html',
  styleUrl: './rating-demo.component.css'
})
export class RatingDemoComponent {
  readonly value = signal(4);
}
