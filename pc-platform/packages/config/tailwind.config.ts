import type { Config } from 'tailwindcss';

/**
 * Shared Tailwind config extended by apps/web and apps/admin.
 *
 * Usage in app:
 *   import sharedConfig from '@pc-platform/config/tailwind.config';
 *   export default { ...sharedConfig, content: [...] };
 */
const sharedConfig: Partial<Config> = {
  theme: {
    extend: {
      colors: {
        // Brand colors
        brand: {
          50: '#f0f4ff',
          100: '#dce7ff',
          200: '#b9cfff',
          300: '#84a9ff',
          400: '#4d7eff',
          500: '#1a56f5', // Primary
          600: '#0e40d9',
          700: '#0c31b0',
          800: '#0e2a8e',
          900: '#112775',
        },
        // Gaming accent
        gaming: {
          400: '#e879f9',
          500: '#d946ef',
          600: '#c026d3',
        },
        // Surface shades (for dark mode UI)
        surface: {
          50: '#f8fafc',
          100: '#f1f5f9',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'ui-sans-serif', 'system-ui'],
        mono: ['var(--font-jetbrains-mono)', 'ui-monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(26, 86, 245, 0)' },
          '50%': { boxShadow: '0 0 20px 4px rgba(26, 86, 245, 0.3)' },
        },
      },
    },
  },
  plugins: [],
};

export default sharedConfig;
