import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        alcaldia: {
          50: '#eef6ff',
          600: '#0a5cb8',
          700: '#08488f',
        },
      },
    },
  },
  plugins: [],
};

export default config;
