export const themes = {
  default: {
    name: 'Default',
    styles: {
      backgroundColor: '#ffffff',
      color: '#000000',
    },
  },
  dark: {
    name: 'Dark',
    styles: {
      backgroundColor: '#000000',
      color: '#ffffff',
    },
  },
  light: {
    name: 'Light',
    styles: {
      backgroundColor: '#f5f5f5',
      color: '#000000',
    },
  },
};

export type Theme = keyof typeof themes;