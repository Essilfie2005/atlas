/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand:   { DEFAULT: '#2563EB', dark: '#1D4ED8', light: '#DBEAFE', 50: '#EFF6FF', 100: '#DBEAFE', 200: '#BFDBFE', 500: '#2563EB', 600: '#1D4ED8', 700: '#1E40AF' },
        sidebar: '#0F172A',
        'sidebar-hover': '#1E293B',
        'sidebar-active': '#1E3A5F',
        'sidebar-muted': '#94A3B8',
        success: '#10B981',
        danger:  '#EF4444',
        warning: '#F59E0B',
        info:    '#06B6D4',
        'page-bg': '#F8FAFC',
        'card-bg': '#FFFFFF',
        border:  '#E2E8F0',
        muted:   '#64748B',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        card:    '0 1px 3px 0 rgba(0,0,0,0.07), 0 1px 2px -1px rgba(0,0,0,0.04)',
        'card-md': '0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -2px rgba(0,0,0,0.04)',
        'card-hover': '0 10px 25px -5px rgba(37,99,235,0.1), 0 8px 10px -6px rgba(37,99,235,0.05)',
        'glow-blue': '0 0 20px rgba(37,99,235,0.25)',
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '24px',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
}
