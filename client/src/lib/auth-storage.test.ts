import { describe, it, expect, beforeEach } from 'vitest';
import { isRemembered, setRememberMe, getAuthToken, setAuthTokenStorage } from './auth-storage';

describe('auth-storage', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('defaults to NOT remembered when the flag is unset', () => {
    expect(isRemembered()).toBe(false);
  });

  it('stores remembered tokens in localStorage and clears sessionStorage', () => {
    setRememberMe(true);
    setAuthTokenStorage('token-local');

    expect(localStorage.getItem('access_token')).toBe('token-local');
    expect(sessionStorage.getItem('access_token')).toBeNull();
    expect(getAuthToken()).toBe('token-local');
  });

  it('stores unremembered tokens in sessionStorage and clears localStorage', () => {
    setRememberMe(false);
    setAuthTokenStorage('token-session');

    expect(sessionStorage.getItem('access_token')).toBe('token-session');
    expect(localStorage.getItem('access_token')).toBeNull();
    expect(getAuthToken()).toBe('token-session');
  });

  it('clears both stores when set to null', () => {
    setRememberMe(true);
    setAuthTokenStorage('token-local');
    setAuthTokenStorage(null);

    expect(localStorage.getItem('access_token')).toBeNull();
    expect(sessionStorage.getItem('access_token')).toBeNull();
  });

  it('falls back to the inactive store when the active store is empty', () => {
    // Simulate a session written before this feature shipped (localStorage).
    localStorage.setItem('access_token', 'legacy-token');

    expect(getAuthToken()).toBe('legacy-token');
  });
});
