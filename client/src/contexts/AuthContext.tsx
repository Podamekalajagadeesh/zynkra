import { useState, useEffect, ReactNode, useCallback } from 'react';
import { getProfile, setAuthToken, uploadPublicKey, logoutFromServer } from '../lib/api';
import { Account, AuthContext } from './AuthContextDef';
import {
  generateAndStoreKeys,
  getKeys,
} from '../services/encryption.service';

const ZYNKRA_ACCOUNTS = 'zynkra_accounts';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [activeAccount, setActiveAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);

  const loadAccounts = useCallback(() => {
    setLoading(true);
    try {
      const storedAccounts = localStorage.getItem(ZYNKRA_ACCOUNTS);
      if (storedAccounts) {
        const parsedAccounts = JSON.parse(storedAccounts);
        setAccounts(parsedAccounts.accounts || []);
        const active = parsedAccounts.accounts.find(
          (a: Account) => a.user.id === parsedAccounts.activeAccountId,
        );
        setActiveAccount(active || parsedAccounts.accounts[0] || null);
        if (active) {
          setAuthToken(active.token);
        }
      }
    } catch (error) {
      console.error('Failed to load accounts from storage:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAccounts();
    window.addEventListener('storage', loadAccounts);
    return () => {
      window.removeEventListener('storage', loadAccounts);
    };
  }, [loadAccounts]);

  const updateStoredAccounts = (
    updatedAccounts: Account[],
    activeId: string | null,
  ) => {
    localStorage.setItem(
      ZYNKRA_ACCOUNTS,
      JSON.stringify({
        accounts: updatedAccounts,
        activeAccountId: activeId,
      }),
    );
    setAccounts(updatedAccounts);
    const newActive =
      updatedAccounts.find((a) => a.user.id === activeId) ||
      updatedAccounts[0] ||
      null;
    setActiveAccount(newActive);
    if (newActive) {
      setAuthToken(newActive.token);
    } else {
      setAuthToken(null);
    }
    window.dispatchEvent(new Event('authchange'));
  };

// ... (rest of the file)

  const addAccount = useCallback(
    async (newAccount: Account) => {
      const existingAccountIndex = accounts.findIndex(
        (acc) => acc.user.id === newAccount.user.id,
      );
      let updatedAccounts;
      if (existingAccountIndex > -1) {
        updatedAccounts = [...accounts];
        updatedAccounts[existingAccountIndex] = newAccount;
      } else {
        updatedAccounts = [...accounts, newAccount];
      }
      const activeId = newAccount.user?.id ?? null;
      updateStoredAccounts(updatedAccounts, activeId);

      // E2EE Key Management
      if (!activeId) {
        console.warn('Skipping key generation because user ID is missing', newAccount.user);
        return;
      }

      try {
        const existingKeys = await getKeys(activeId);
        if (!existingKeys) {
          await generateAndStoreKeys(activeId);
          const newKeys = await getKeys(activeId);
          if (newKeys) {
            // Convert Uint8Array to base64 string for transport
            const publicKeyBase64 = btoa(
              String.fromCharCode.apply(null, Array.from(newKeys.publicKey)),
            );
            await uploadPublicKey(publicKeyBase64);
          }
        }
      } catch (error) {
        console.error('Failed to manage encryption keys:', error);
      }
    },
    [accounts],
  );

  const switchAccount = useCallback(
    async (accountId: string) => {
      const accountToSwitch = accounts.find((a) => a.user.id === accountId);
      if (!accountToSwitch) {
        return;
      }

      updateStoredAccounts(accounts, accountId);
    },
    [accounts],
  );

  const logout = useCallback(async () => {
    if (activeAccount) {
      try {
        await logoutFromServer();
      } catch (error) {
        console.warn('Server logout failed, cleaning up locally anyway:', error);
      }

      const remainingAccounts = accounts.filter(
        (a) => a.user.id !== activeAccount.user.id,
      );
      const newActiveId = remainingAccounts.length
        ? remainingAccounts[0].user.id
        : null;
      updateStoredAccounts(remainingAccounts, newActiveId);
    }
  }, [accounts, activeAccount]);

  const setUser = useCallback(
    (user) => {
      if (activeAccount) {
        const updatedAccount = { ...activeAccount, user };
        const updatedAccounts = accounts.map((acc) =>
          acc.user.id === user.id ? updatedAccount : acc,
        );
        updateStoredAccounts(updatedAccounts, user.id);
      }
    },
    [accounts, activeAccount],
  );

  const isLoggedIn = Boolean(activeAccount?.token);

  const value = {
    accounts,
    activeAccount,
    user: activeAccount?.user ?? null,
    token: activeAccount?.token ?? null,
    loading,
    isLoading: loading,
    isLoggedIn,
    addAccount,
    switchAccount,
    logout,
    setUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

import { useContext } from 'react';
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}