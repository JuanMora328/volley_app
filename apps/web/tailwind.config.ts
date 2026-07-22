import type { Config } from 'tailwindcss';
export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: { primary: '#091426', secondary: '#0051d5', surface: '#f7f9fb', muted: '#e6e8ea' },
      fontFamily: { sans: ['Inter', 'sans-serif'] },
      borderRadius: { xl: '0.75rem' },
    },
  },
  plugins: [],
} satisfies Config;
