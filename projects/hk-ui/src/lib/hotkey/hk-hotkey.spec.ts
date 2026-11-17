import { Component, inject } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HkHotkeyService } from './hk-hotkey.service';

const press = (key: string, init: KeyboardEventInit = {}, target: EventTarget = document.body): void => {
  target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, ...init }));
};

@Component({ template: '' })
class BinderComponent {
  fired = 0;
  constructor() {
    inject(HkHotkeyService).bind('d', () => this.fired++);
  }
}

describe('HkHotkeyService', () => {
  let service: HkHotkeyService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(HkHotkeyService);
  });

  it('fires a single-key binding and unbinds on request', () => {
    let count = 0;
    service.bind('g', () => count++);
    press('g');
    expect(count).toBe(1);
    service.unbind('g');
    press('g');
    expect(count).toBe(1);
  });

  it('matches "?" regardless of the shift it needs', () => {
    let count = 0;
    service.bind('?', () => count++);
    press('?', { shiftKey: true });
    expect(count).toBe(1);
  });

  it('never fires while typing in a field', () => {
    let count = 0;
    service.bind('g', () => count++);
    const input = document.createElement('input');
    document.body.appendChild(input);
    press('g', {}, input);
    input.remove();
    expect(count).toBe(0);
  });

  it('supports two-key sequences', () => {
    let count = 0;
    service.bind('g d', () => count++);
    press('g');
    press('d');
    expect(count).toBe(1);
  });

  it('lets a scope shadow a global binding until destroyed', () => {
    const calls: string[] = [];
    service.bind('x', () => calls.push('global'));
    const scope = service.scope('dialog');
    scope.bind('x', () => calls.push('scope'));
    press('x');
    scope.destroy();
    press('x');
    expect(calls).toEqual(['scope', 'global']);
  });

  it('unbinds automatically when the registering component is destroyed', () => {
    const fixture = TestBed.createComponent(BinderComponent);
    const component = fixture.componentInstance;
    press('d');
    expect(component.fired).toBe(1);
    fixture.destroy();
    press('d');
    expect(component.fired).toBe(1);
  });
});
