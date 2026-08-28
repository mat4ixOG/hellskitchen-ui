import { Component, signal } from '@angular/core';

type Size = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-switch-demo',
  imports: [],
  templateUrl: './switch-demo.component.html',
  styleUrl: './switch-demo.component.css'
})
export class SwitchDemoComponent {
  readonly checked = signal(true);
  readonly size = signal<Size>('lg');

  cycleSize(): void {
    const order: Size[] = ['sm', 'md', 'lg'];
    this.size.set(order[(order.indexOf(this.size()) + 1) % order.length]);
  }

  trackClass(): string {
    return { sm: 'h-5 w-9', md: 'h-6 w-11', lg: 'h-8 w-14' }[this.size()];
  }

  thumbClass(): string {
    const box = { sm: 'h-3.5 w-3.5', md: 'h-4.5 w-4.5', lg: 'h-6 w-6' }[this.size()];
    const shift = this.checked()
      ? { sm: 'translate-x-4', md: 'translate-x-5', lg: 'translate-x-6' }[this.size()]
      : 'translate-x-0';
    return `${box} ${shift}`;
  }
}
