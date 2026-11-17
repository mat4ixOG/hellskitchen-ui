import { Component, signal } from '@angular/core';
import { HkSwitchComponent, HkSwitchSize } from 'hellskitchen-ui';

@Component({
  selector: 'app-switch-demo',
  imports: [HkSwitchComponent],
  templateUrl: './switch-demo.component.html',
  styleUrl: './switch-demo.component.css'
})
export class SwitchDemoComponent {
  readonly checked = signal(true);
  readonly size = signal<HkSwitchSize>('lg');

  cycleSize(): void {
    const order: HkSwitchSize[] = ['sm', 'md', 'lg'];
    this.size.set(order[(order.indexOf(this.size()) + 1) % order.length]);
  }
}
