import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#14b8a6', // turquoise
          dark: '#0d9488',
          light: '#5eead4',
        },
        accent: {
          DEFAULT: '#7c3aed', // violet
          dark: '#6d28d9',
          light: '#a78bfa',
        },
        background: {
          DEFAULT: '#ffffff',
          dark: '#0f172a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 10px 15px -3px rgba(20, 184, 166, 0.1), 0 4px 6px -4px rgba(124, 58, 237, 0.1)',
      },
    },
  },
  plugins: [],
}

export default config
