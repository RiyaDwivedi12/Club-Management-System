/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'Poppins', 'sans-serif'],
      },
      colors: {
        // Brand primary — the blue used by the landing page (blue-600 is the main action color)
        primary: {
          50:  '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },
        // Campus navy — headings, dark panels and the stats band
        dark: {
          700: '#24304f',
          800: '#1c2541',
          900: '#0b132b',
          950: '#060b1a',
        },
      },
      boxShadow: {
        'soft':       '0 10px 40px -10px rgba(15,23,42,0.08)',
        'card':       '0 1px 2px 0 rgba(15,23,42,0.04), 0 1px 3px 0 rgba(15,23,42,0.03)',
        'card-hover': '0 20px 40px -20px rgba(30,58,138,0.25)',
        'brand':      '0 10px 24px -8px rgba(37,99,235,0.35)',
        // legacy names kept so existing references keep working
        'soft-green':  '0 10px 40px -10px rgba(37,99,235,0.30)',
        'soft-teal':   '0 10px 40px -10px rgba(37,99,235,0.30)',
        'soft-purple': '0 10px 40px -10px rgba(37,99,235,0.25)',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':      { transform: 'translateY(-8px)' },
        },
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
