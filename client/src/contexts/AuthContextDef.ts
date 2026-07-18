import { createContext } from 'react';
import { UserProfile } from '../lib/types';

export interface Account {
  user: UserProfile;
  token: string;
}

export interface AuthContextType {
  accounts: Account[];
  activeAccount: Account | null;
  user: UserProfile | null;
  token: string | null;
  loading: boolean;
  isLoading: boolean;
  isLoggedIn: boolean;
  switchAccount: (accountId: string) => void;
  addAccount: (account: Account) => void;
  logout: () => void;
  setUser: (user: UserProfile) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);