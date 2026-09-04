import { TestBed } from '@angular/core/testing';
import { VisitorCountService } from './visitor-count.service';

describe('VisitorCountService', () => {
  let service: VisitorCountService;
  let fetchSpy: jasmine.Spy;

  const ok = (body: unknown) =>
    Promise.resolve({
      ok: true,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: () => Promise.resolve(body)
    } as unknown as Response);

  beforeEach(() => {
    sessionStorage.removeItem('hk-visit');
    TestBed.configureTestingModule({});
    service = TestBed.inject(VisitorCountService);
    fetchSpy = spyOn(window, 'fetch');
  });

  afterEach(() => sessionStorage.removeItem('hk-visit'));

  it('starts with no number rather than a zero', () => {
    expect(service.total()).toBeNull();
  });

  it('POSTs on the first visit of a session and publishes the count', async () => {
    fetchSpy.and.returnValue(ok({ total: 1234 }));
    service.load();
    await fetchSpy.calls.mostRecent().returnValue;
    await Promise.resolve();

    expect(fetchSpy.calls.mostRecent().args[1]?.method).toBe('POST');
    expect(service.total()).toBe(1234);
  });

  it('only reads on a second load in the same session', async () => {
    sessionStorage.setItem('hk-visit', '1');
    fetchSpy.and.returnValue(ok({ total: 7 }));
    service.load();
    await fetchSpy.calls.mostRecent().returnValue;
    await Promise.resolve();

    // Navigating within the SPA must not inflate the number.
    expect(fetchSpy.calls.mostRecent().args[1]?.method).toBe('GET');
  });

  it('does no work at all on a repeat load()', () => {
    fetchSpy.and.returnValue(ok({ total: 1 }));
    service.load();
    service.load();
    service.load();
    expect(fetchSpy.calls.count()).toBe(1);
  });

  it('stays silent when the endpoint is missing', async () => {
    fetchSpy.and.returnValue(Promise.resolve({ ok: false, status: 503 } as Response));
    service.load();
    await fetchSpy.calls.mostRecent().returnValue;
    await Promise.resolve();
    // A 503 (KV unbound, or local ng serve) must leave the badge hidden.
    expect(service.total()).toBeNull();
  });

  it('ignores an SPA fallback that answers 200 with the index page', async () => {
    // `ng serve` and any static host without the Function behave this way.
    fetchSpy.and.returnValue(
      Promise.resolve({
        ok: true,
        headers: new Headers({ 'content-type': 'text/html' }),
        json: () => Promise.reject(new Error('not json'))
      } as unknown as Response)
    );
    service.load();
    await fetchSpy.calls.mostRecent().returnValue;
    await Promise.resolve();
    expect(service.total()).toBeNull();
  });

  it('survives a network failure without throwing', async () => {
    fetchSpy.and.returnValue(Promise.reject(new Error('offline')));
    service.load();
    await Promise.resolve();
    await Promise.resolve();
    expect(service.total()).toBeNull();
  });

  it('ignores a malformed payload', async () => {
    fetchSpy.and.returnValue(ok({ total: 'lots' }));
    service.load();
    await fetchSpy.calls.mostRecent().returnValue;
    await Promise.resolve();
    expect(service.total()).toBeNull();
  });
});
