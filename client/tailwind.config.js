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
        // Brand primary — aligned with the teal used across the layout
        primary: {
          50:  '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',  // ← main action color (same as teal-600)
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
          950: '#042f2e',
        },
        // Campus navy — matches the admin sidebar (#0B132B)
        dark: {
          800: '#1c2541',
          900: '#0b132b',
          950: '#060b1a',
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
        'soft-green': '0 10px 40px -10px rgba(13,148,136,0.30)',
        'soft-teal':  '0 10px 40px -10px rgba(13,148,136,0.30)',
        // keep old name so any remaining references don't break
        'soft-purple': '0 10px 40px -10px rgba(13,148,136,0.25)',
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
