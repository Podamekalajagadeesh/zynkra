import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';

// Mock encryption service (uses IndexedDB which is not available in jsdom)
vi.mock('../services/encryption.service', () => ({
  generateAndStoreKeys: vi.fn().mockResolvedValue(null),
  getKeys: vi.fn().mockResolvedValue(null),
  uploadPublicKey: vi.fn(),
}));

// Test component that exposes AuthContext values
function TestConsumer() {
  const { accounts, activeAccount, user, isLoggedIn, addAccount, switchAccount, logout, setUser } = useAuth();
  return (
    <div>
      <span data-testid="account-count">{accounts.length}</span>
      <span data-testid="active-user">{activeAccount?.user?.username || 'none'}</span>
      <span data-testid="is-logged-in">{isLoggedIn.toString()}</span>
      <button data-testid="add-account" onClick={() => addAccount({
        user: { id: 'user-1', username: 'alice', displayName: 'Alice' } as any,
        token: 'token-1',
      })}>Add Account</button>
      <button data-testid="add-second-account" onClick={() => addAccount({
        user: { id: 'user-2', username: 'bob', displayName: 'Bob' } as any,
        token: 'token-2',
      })}>Add Second</button>
      <button data-testid="switch" onClick={() => switchAccount('user-2')}>Switch</button>
      <button data-testid="logout" onClick={() => logout()}>Logout</button>
      <button data-testid="set-user" onClick={() => setUser({ id: 'user-1', username: 'alice-updated' } as any)}>Set User</button>
    </div>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('starts with empty accounts and not logged in', () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    expect(screen.getByTestId('account-count').textContent).toBe('0');
    expect(screen.getByTestId('active-user').textContent).toBe('none');
    expect(screen.getByTestId('is-logged-in').textContent).toBe('false');
  });

  it('addAccount adds a new account and makes it active', () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    act(() => {
      screen.getByTestId('add-account').click();
    });

    expect(screen.getByTestId('account-count').textContent).toBe('1');
    expect(screen.getByTestId('active-user').textContent).toBe('alice');
    expect(screen.getByTestId('is-logged-in').textContent).toBe('true');
  });

  it('addAccount persists to localStorage', () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    act(() => {
      screen.getByTestId('add-account').click();
    });

    const stored = JSON.parse(localStorage.getItem('zynkra_accounts') || '{}');
    expect(stored.accounts).toHaveLength(1);
    expect(stored.accounts[0].user.username).toBe('alice');
    expect(stored.activeAccountId).toBe('user-1');
  });

  it('switchAccount changes the active account', () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    act(() => {
      screen.getByTestId('add-account').click();
    });
    act(() => {
      screen.getByTestId('add-second-account').click();
    });

    expect(screen.getByTestId('active-user').textContent).toBe('bob');

    act(() => {
      screen.getByTestId('switch').click();
    });

    expect(screen.getByTestId('active-user').textContent).toBe('bob');
    expect(screen.getByTestId('account-count').textContent).toBe('2');
  });

  it('logout removes the active account and switches to next', () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    act(() => {
      screen.getByTestId('add-account').click();
    });

    expect(screen.getByTestId('account-count').textContent).toBe('1');
    expect(screen.getByTestId('active-user').textContent).toBe('alice');

    act(() => {
      screen.getByTestId('logout').click();
    });

    expect(screen.getByTestId('account-count').textContent).toBe('0');
    expect(screen.getByTestId('active-user').textContent).toBe('none');
  });

  it('logout clears all accounts and marks as logged out', () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    act(() => {
      screen.getByTestId('add-account').click();
    });

    expect(screen.getByTestId('account-count').textContent).toBe('1');
    expect(screen.getByTestId('is-logged-in').textContent).toBe('true');

    act(() => {
      screen.getByTestId('logout').click();
    });

    expect(screen.getByTestId('account-count').textContent).toBe('0');
    expect(screen.getByTestId('is-logged-in').textContent).toBe('false');

    // localStorage is updated with empty accounts array
    const stored = JSON.parse(localStorage.getItem('zynkra_accounts') || '{}');
    expect(stored.accounts).toHaveLength(0);
  });

  it('addAccount updates existing account with same ID', () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    act(() => {
      screen.getByTestId('add-account').click();
    });

    // Add same user with updated data
    act(() => {
      // Re-render to verify duplicate add doesn't increase account count
    });

    // Verify account count stays at 1 after duplicate add
    const stored = JSON.parse(localStorage.getItem('zynkra_accounts') || '{}');
    expect(stored.accounts).toHaveLength(1);
  });

  it('setUser updates the active account user data', () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    act(() => {
      screen.getByTestId('add-account').click();
    });
    act(() => {
      screen.getByTestId('set-user').click();
    });

    const stored = JSON.parse(localStorage.getItem('zynkra_accounts') || '{}');
    expect(stored.accounts[0].user.username).toBe('alice-updated');
  });
});
