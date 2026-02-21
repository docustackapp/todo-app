import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  safelist: ['dark'],
  theme: {
    extend: {
      colors: {
        todoodle: {
          coral:    '#FF6B6B',
          teal:     '#4ECDC4',
          yellow:   '#FFE66D',
          lavender: '#A78BFA',
        },
      },
      fontFamily: {
        sans: ['Nunito', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config
