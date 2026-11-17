import { TestBed } from '@angular/core/testing';
import { HkConfirmService } from './hk-confirm.service';

describe('HkConfirmService', () => {
  let service: HkConfirmService;
  const panel = (): HTMLElement | null => document.body.querySelector('[role="alertdialog"]');
  const button = (cls: string): HTMLButtonElement => document.body.querySelector(`.${cls}`)!;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(HkConfirmService);
  });

  it('renders the prompt with the given copy', async () => {
    const answer = service.ask({
      title: 'Delete this service?',
      body: 'This cannot be undone.',
      confirmLabel: 'Delete',
      cancelLabel: 'Keep it',
      tone: 'danger'
    });
    expect(panel()?.textContent).toContain('Delete this service?');
    expect(panel()?.textContent).toContain('This cannot be undone.');
    expect(button('hk-confirm-ok').textContent?.trim()).toBe('Delete');
    expect(button('hk-confirm-ok').getAttribute('data-tone')).toBe('danger');
    expect(button('hk-confirm-cancel').textContent?.trim()).toBe('Keep it');
    button('hk-confirm-cancel').click();
    await answer;
  });

  it('resolves true on confirm and removes itself', async () => {
    const answer = service.ask({ title: 'Sure?' });
    button('hk-confirm-ok').click();
    expect(await answer).toBeTrue();
    expect(panel()).toBeNull();
  });

  it('resolves false on cancel and on Escape', async () => {
    const cancelled = service.ask({ title: 'Sure?' });
    button('hk-confirm-cancel').click();
    expect(await cancelled).toBeFalse();

    const escaped = service.ask({ title: 'Sure?' });
    button('hk-confirm-ok').dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(await escaped).toBeFalse();
    expect(panel()).toBeNull();
  });
});
