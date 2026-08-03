export type ThemeMode = 'light' | 'dark' | 'both';

export interface ThemeDefinition {
  key: string;
  name: string;
  accent: string;
  mode: ThemeMode;
}

// Built-in creator/profile themes. `key` is what `user.profileTheme` stores;
// `accent` is the default accent applied when the user hasn't set a custom
// profileThemeColor. Add new themes here — GET /themes picks them up.
export const THEMES: ThemeDefinition[] = [
  { key: 'default', name: 'Zynkra', accent: '#3B82F6', mode: 'both' },
  { key: 'midnight', name: 'Midnight', accent: '#6366F1', mode: 'dark' },
  { key: 'sunset', name: 'Sunset', accent: '#F97316', mode: 'light' },
  { key: 'forest', name: 'Forest', accent: '#10B981', mode: 'both' },
  { key: 'ocean', name: 'Ocean', accent: '#0EA5E9', mode: 'light' },
  { key: 'rose', name: 'Rose', accent: '#F43F5E', mode: 'light' },
  { key: 'gold', name: 'Gold', accent: '#F59E0B', mode: 'light' },
  { key: 'violet', name: 'Violet', accent: '#8B5CF6', mode: 'both' },
  { key: 'monochrome', name: 'Monochrome', accent: '#64748B', mode: 'both' },
  { key: 'terminal', name: 'Terminal', accent: '#22C55E', mode: 'dark' },
];
