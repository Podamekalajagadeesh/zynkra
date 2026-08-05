const REMEMBER_ME_KEY = 'zynkra_remember_me';
const ACCESS_TOKEN_KEY = 'access_token';

// Remembered sessions persist across browser restarts (localStorage); unremembered
// sessions live in sessionStorage and are cleared when the tab/browser closes.
// Defaults to NOT remembered when the flag has never been set (secure default).
export const isRemembered = (): boolean =>
  localStorage.getItem(REMEMBER_ME_KEY) === 'true';

export const setRememberMe = (value: boolean): void => {
  localStorage.setItem(REMEMBER_ME_KEY, String(value));
};

const activeStore = (): Storage => (isRemembered() ? localStorage : sessionStorage);

// Reads the token from the active store, falling back to the other store so a
// session established before this feature shipped (or before a flag change) is
// still picked up.
export const getAuthToken = (): string | null => {
  const active = activeStore().getItem(ACCESS_TOKEN_KEY);
  if (active) return active;
  const inactive = isRemembered() ? sessionStorage : localStorage;
  return inactive.getItem(ACCESS_TOKEN_KEY);
};

// Writes the token to the store matching the remember-me flag and clears the other
// store so only one store ever holds it. Passing null clears both stores.
export const setAuthTokenStorage = (token: string | null): void => {
  if (token) {
    activeStore().setItem(ACCESS_TOKEN_KEY, token);
    const other = isRemembered() ? sessionStorage : localStorage;
    other.removeItem(ACCESS_TOKEN_KEY);
  } else {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  }
};
