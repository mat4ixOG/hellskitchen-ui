import { TestBed } from '@angular/core/testing';
import { ChatLauncherService } from './chat-launcher.service';

describe('ChatLauncherService', () => {
  let service: ChatLauncherService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ChatLauncherService);
  });

  it('is off until something asks for it', () => {
    // The corner button is a demo of a docked assistant, not a support widget
    // this site offers — it must not appear on a page nobody summoned it from.
    expect(service.enabled()).toBeFalse();
    expect(service.isOpen()).toBeFalse();
  });

  it('turns on and back off', () => {
    service.enable();
    expect(service.enabled()).toBeTrue();
    service.disable();
    expect(service.enabled()).toBeFalse();
  });

  it('emits a fresh open request even when already open', () => {
    // A counter, not a boolean: the demo asks to open it again while it is
    // showing, and a boolean already true would emit nothing.
    const first = service.openSignal();
    service.open();
    const second = service.openSignal();
    service.open();
    expect(second).toBeGreaterThan(first);
    expect(service.openSignal()).toBeGreaterThan(second);
  });

  it('closes as part of disabling, so it cannot be left open but hidden', () => {
    const before = service.closeSignal();
    service.enable();
    service.disable();
    expect(service.closeSignal()).toBeGreaterThan(before);
    expect(service.enabled()).toBeFalse();
  });
});
