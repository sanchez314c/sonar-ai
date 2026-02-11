/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'neo-void': '#0a0b0e',
        'neo-surface': '#111214',
        'neo-card': '#141518',
        'neo-card-hover': '#1a1b1f',
        'neo-sidebar': '#0d0e10',
        'neo-tertiary': '#18191c',
        'neo-input': '#18191c',
        'neo-teal': '#14b8a6',
        'neo-teal-hover': '#0d9488',
        'neo-blue': '#06b6d4',
        'neo-purple': '#8b5cf6',
        'neo-text-primary': '#e8e8ec',
        'neo-text-secondary': '#9a9aa6',
        'neo-text-muted': '#5c5c6a',
        'neo-text-dim': '#44444e',
        'neo-text-heading': '#f4f4f7',
        'neo-border-subtle': '#1e1e24',
        'neo-border-light': '#2a2a30',
        'neo-success': '#10b981',
        'neo-warning': '#f59e0b',
        'neo-error': '#ef4444',
        'neo-info': '#38bdf8',
        'neo-scrollbar': '#2a2a32',
        'neo-scrollbar-hover': '#3a3a44',
      },
      fontFamily: {
        'neo': ['Inter', '-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'Roboto', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
      },
      boxShadow: {
        'neo-sm': '0 1px 2px rgba(0,0,0,0.2), 0 2px 4px rgba(0,0,0,0.15)',
        'neo-md': '0 2px 4px rgba(0,0,0,0.2), 0 4px 8px rgba(0,0,0,0.2), 0 8px 16px rgba(0,0,0,0.15)',
        'neo-lg': '0 4px 8px rgba(0,0,0,0.2), 0 8px 16px rgba(0,0,0,0.2), 0 16px 32px rgba(0,0,0,0.2)',
        'neo-xl': '0 4px 8px rgba(0,0,0,0.15), 0 8px 16px rgba(0,0,0,0.15), 0 16px 32px rgba(0,0,0,0.2), 0 32px 64px rgba(0,0,0,0.25)',
        'neo-card': '0 2px 4px rgba(0,0,0,0.15), 0 4px 12px rgba(0,0,0,0.2), 0 8px 24px rgba(0,0,0,0.15)',
        'neo-card-hover': '0 4px 8px rgba(0,0,0,0.2), 0 8px 24px rgba(0,0,0,0.25), 0 16px 44px rgba(0,0,0,0.2)',
        'neo-glow': '0 0 16px rgba(20,184,166,0.15)',
        'neo-glow-strong': '0 0 24px rgba(20,184,166,0.25)',
        'neo-inset': 'inset 0 1px 3px rgba(0,0,0,0.4)',
      },
      borderRadius: {
        'neo-card': '14px',
        'neo-xl': '20px',
      },
    },
  },
  plugins: [],
}
