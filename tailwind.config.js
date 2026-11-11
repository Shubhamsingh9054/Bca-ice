/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          purple: '#42126D',
          purpleDark: '#2E0A4E',
          purpleLight: '#5B1F94',
          purpleBadge: '#3E1268',
          amber: '#FF9E1B',
          amberHover: '#E68A0D',
          cream: '#FAF7F2',
          creamDark: '#F3ECE1',
          creamBg: '#FAF7F2',
          orange: '#FF9E1B',
          orangeHover: '#E68A0D',
          red: '#D92038',
          blue: '#247BA0',
          dark: '#241E2B',
          gray: '#6C757D',
          lightGray: '#F8F9FA',
          border: '#EDE6DA',
          card: '#FFFFFF',
          cardBg: '#FFFFFF',
          lavender: '#F3E8FF',
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        script: ['"Caveat"', 'cursive'],
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(66, 18, 109, 0.08), 0 2px 6px -1px rgba(0, 0, 0, 0.04)',
        'card': '0 6px 18px -4px rgba(36, 30, 43, 0.06), 0 2px 6px -2px rgba(36, 30, 43, 0.04)',
        'elevated': '0 12px 28px -6px rgba(66, 18, 109, 0.16), 0 4px 12px -2px rgba(0, 0, 0, 0.06)',
        'squircle': '0 2px 8px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      }
    },
  },
  plugins: [],
}
