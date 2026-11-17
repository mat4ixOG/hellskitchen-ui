import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HkChatbotComponent, HkChatbotEngine, HkChatbotMessage } from './hk-chatbot.component';

@Component({
  imports: [HkChatbotComponent],
  template: `
    <hk-chatbot [engine]="engine" [messages]="messages()" [busy]="busy()"
      [tools]="[{ name: 'weather', icon: 'x-cloud' }]" [suggestions]="['Hi there']" />
  `
})
class HostComponent {
  readonly messages = signal<HkChatbotMessage[]>([]);
  readonly busy = signal(false);
  readonly sent: string[] = [];
  aborted = 0;
  resets = 0;
  readonly engine: HkChatbotEngine = {
    send: (text: string) => this.sent.push(text),
    abort: () => this.aborted++,
    reset: () => this.resets++
  };
}

describe('HkChatbotComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  const el = <T extends HTMLElement>(selector: string): T => fixture.nativeElement.querySelector(selector);
  const all = (selector: string): HTMLElement[] => Array.from(fixture.nativeElement.querySelectorAll(selector));

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('shows the empty state with suggestions that send through the engine', () => {
    expect(el('[role="log"]').getAttribute('aria-live')).toBe('polite');
    expect(el('.hk-chat-toolbar').textContent).toContain('1 tools');
    el<HTMLButtonElement>('.hk-chat-suggestion').click();
    expect(host.sent).toEqual(['Hi there']);
  });

  it('sends the draft on Enter but not on Shift+Enter', () => {
    const textarea = el<HTMLTextAreaElement>('textarea');
    textarea.value = 'hello';
    textarea.dispatchEvent(new Event('input'));
    textarea.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', shiftKey: true }));
    expect(host.sent).toEqual([]);
    textarea.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(host.sent).toEqual(['hello']);
  });

  it('renders messages, hides system ones, and shows tool calls', () => {
    host.messages.set([
      { id: 's', role: 'system', content: 'secret prompt', at: 0 },
      { id: 'u', role: 'user', content: 'weather?', at: 0 },
      {
        id: 'a', role: 'assistant', content: 'Sunny.', at: 0,
        toolCalls: [{ id: 'c', name: 'weather', args: { city: 'Bergen' }, state: 'done', result: { t: 12 }, ms: 4 }]
      }
    ]);
    fixture.detectChanges();
    expect(all('.hk-chat-bubble').map((b) => b.textContent?.trim())).toEqual(['weather?', 'Sunny.']);
    expect(fixture.nativeElement.textContent).not.toContain('secret prompt');
    expect(el('.hk-chat-tool').textContent).toContain('city: "Bergen"');
    expect(el('.hk-chat-tool i.x-cloud')).toBeTruthy();
  });

  it('stops and clears through the engine', () => {
    host.busy.set(true);
    fixture.detectChanges();
    const stop = all('.hk-chat-chip').find((b) => b.textContent?.includes('Stop')) as HTMLButtonElement;
    stop.click();
    expect(host.aborted).toBe(1);
    const clear = all('.hk-chat-chip').find((b) => b.textContent?.includes('Clear')) as HTMLButtonElement;
    clear.click();
    expect(host.resets).toBe(1);
    expect(el<HTMLButtonElement>('.hk-chat-send').disabled).toBeTrue();
  });
});
