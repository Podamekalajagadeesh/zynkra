import { useAuth } from './useAuth';

export const useUser = () => {
  const { activeAccount } = useAuth();
  return { user: activeAccount?.user ?? null };
};