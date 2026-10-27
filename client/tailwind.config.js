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
        primary: {
          50:  '#f0fdf4',  // lightest teal-green tint
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',  // green-500
          600: '#16a34a',  // green-600  ← main action color
          700: '#15803d',
          800: '#166534',
          900: '#14532d',  // darkest
        },
        // Keep a teal alias for the darker teal panels used in Login/Register
        teal: {
          50:  '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',  // ← teal-600, dark left panel accent
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
        },
      },
      boxShadow: {
        'soft':       '0 10px 40px -10px rgba(0,0,0,0.08)',
        'soft-green': '0 10px 40px -10px rgba(22,163,74,0.30)',
        'soft-teal':  '0 10px 40px -10px rgba(13,148,136,0.30)',
        // keep old name so any remaining references don't break
        'soft-purple': '0 10px 40px -10px rgba(22,163,74,0.25)',
      },
    },
  },
  plugins: [],
}
