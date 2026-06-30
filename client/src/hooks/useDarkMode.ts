import { useAppPreferences } from '../contexts/PreferencesContext';

export function useDarkMode() {
  const { theme, toggleTheme } = useAppPreferences();

  return { theme, toggleTheme };
}