import { describe, expect, it } from 'vitest';

/**
 * Regression: on Node >= 22.4 the host runtime defines native
 * `localStorage` / `sessionStorage` globals that resolve to `undefined`
 * without `--localstorage-file`. vitest's jsdom environment then skips
 * copying jsdom's own storage onto the test global (the key already exists
 * on the host global and is not on vitest's allowlist), so every test saw
 * `undefined` and `localStorage.getItem(...)` threw. `src/test-setup.ts`
 * reinstalls an in-memory Storage in that case; these tests pin the
 * environment contract itself, which is what broke.
 */
describe('test environment web storage', () => {
  it('provides a working localStorage regardless of the host Node runtime', () => {
    expect(typeof localStorage).toBe('object');

    localStorage.setItem('zynkra-regression', 'ok');
    expect(localStorage.getItem('zynkra-regression')).toBe('ok');

    localStorage.removeItem('zynkra-regression');
    expect(localStorage.getItem('zynkra-regression')).toBeNull();
  });

  it('provides a working sessionStorage regardless of the host Node runtime', () => {
    expect(typeof sessionStorage).toBe('object');

    sessionStorage.setItem('zynkra-regression', 'ok');
    expect(sessionStorage.getItem('zynkra-regression')).toBe('ok');

    sessionStorage.removeItem('zynkra-regression');
    expect(sessionStorage.getItem('zynkra-regression')).toBeNull();
  });

  it('sends realm FormData through Request as real multipart', () => {
    const body = new FormData();
    body.append('displayName', 'Test');

    const contentType = new Request('http://localhost/', {
      method: 'POST',
      body,
    }).headers.get('content-type');

    expect(contentType).toMatch(/^multipart\/form-data/);
  });
});
