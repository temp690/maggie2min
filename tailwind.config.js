/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        midnight: {
          950: "#080c14",
          900: "#0d1321",
          850: "#131b2e",
          800: "#1a243b",
          700: "#243252",
          600: "#374971",
        },
        brand: {
          amber: "#f59e0b",
          orange: "#f97316",
          red: "#ef4444",
          green: "#10b981",
        }
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'sans-serif'],
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { opacity: 1, transform: 'scale(1)' },
          '50%': { opacity: 0.8, transform: 'scale(1.03)' },
        }
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'pulseGlow 2s ease-in-out infinite',
      }
    },
  },
  plugins: [],
};
