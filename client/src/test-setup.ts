import '@testing-library/jest-dom';
import { vi } from 'vitest';

HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);
HTMLMediaElement.prototype.pause = vi.fn();

/**
 * Web-storage safety net for host runtimes that shadow jsdom's globals.
 *
 * Node >= 22.4 defines its own native `localStorage` / `sessionStorage`
 * globals, which resolve to `undefined` unless the process was started with
 * `--localstorage-file`. vitest's jsdom environment copies jsdom's window keys
 * onto the test global in `getWindowKeys()`, but *drops* any key the host
 * global already defines unless it is on vitest's hard-coded allowlist — and
 * `localStorage` / `sessionStorage` are not on it. On such runtimes every test
 * therefore observes `undefined`, and calls like `localStorage.getItem(...)`
 * throw `TypeError: Cannot read properties of undefined`. (On Node 20, which
 * CI uses, the native globals do not exist and this block is a no-op.)
 */
class InMemoryStorage implements Storage {
  private store = new Map<string, string>();

  get length(): number {
    return this.store.size;
  }

  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null;
  }

  getItem(key: string): string | null {
    return this.store.has(key) ? (this.store.get(key) as string) : null;
  }

  setItem(key: string, value: string): void {
    this.store.set(key, String(value));
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  [name: string]: unknown;
}

function hasUsableStorage(storage: unknown): storage is Storage {
  try {
    return typeof (storage as Storage | undefined)?.getItem === 'function';
  } catch {
    return false;
  }
}

if (!hasUsableStorage(globalThis.localStorage)) {
  Object.defineProperty(globalThis, 'localStorage', {
    value: new InMemoryStorage(),
    writable: true,
    configurable: true,
  });
}

if (!hasUsableStorage(globalThis.sessionStorage)) {
  Object.defineProperty(globalThis, 'sessionStorage', {
    value: new InMemoryStorage(),
    writable: true,
    configurable: true,
  });
}

/**
 * FormData realm realignment.
 *
 * Recent Node runtimes only serialize `FormData` bodies through
 * `new Request(url, { body })` when the instance comes from the runtime's own
 * realm; jsdom's FormData is cross-realm, so the body silently degrades to
 * the literal string "[object FormData]" with `Content-Type: text/plain`.
 * MSW's interceptors wrap every intercepted XHR in exactly such a `Request`,
 * so any handler that reads `request.formData()` fails on those runtimes
 * (Node 20, which CI uses, duck-types the body and is unaffected). When the
 * runtime rejects the realm's current FormData, replace it with the
 * runtime's own — recovered via `Response.formData()`, which always returns
 * a native instance — so request bodies round-trip as real multipart.
 */
function runtimeAcceptsCurrentFormData(): boolean {
  try {
    const probe = new FormData();
    probe.append('probe', '1');
    const contentType = new Request('http://localhost/', {
      method: 'POST',
      body: probe,
    }).headers.get('content-type');
    return contentType !== null && contentType.startsWith('multipart/form-data');
  } catch {
    return false;
  }
}

if (!runtimeAcceptsCurrentFormData()) {
  const boundary = 'zynkra-formdata-probe';
  const multipart = [
    `--${boundary}`,
    'Content-Disposition: form-data; name="probe"',
    '',
    '1',
    `--${boundary}--`,
    '',
  ].join('\r\n');
  const nativeFormData = await new Response(multipart, {
    headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}` },
  }).formData();
  Object.defineProperty(globalThis, 'FormData', {
    value: nativeFormData.constructor,
    writable: true,
    configurable: true,
  });
}
