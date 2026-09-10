import type { Config } from 'tailwindcss';

/**
 * Shared Tailwind config extended by apps/web and apps/admin.
 *
 * Polished gaming and technology design system inspired by precision
 * PC configurators and gaming e-commerce.
 */
const sharedConfig: Partial<Config> = {
  theme: {
    extend: {
      colors: {
        // shadcn CSS variable bindings
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive, 0 84.2% 60.2%))',
          foreground: 'hsl(var(--destructive-foreground, 210 40% 98%))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover, var(--card)))',
          foreground: 'hsl(var(--popover-foreground, var(--card-foreground)))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },

        // Dark tech & gaming surfaces
        cyber: {
          950: '#060911', // Deepest background
          900: '#0B101D', // Card & panel background
          850: '#101626', // Elevated surface
          800: '#161E33', // Secondary surface
          700: '#1F2B48', // Hover surface / active
          600: '#2F3E64', // Subtle border
          500: '#475A87',
        },

        // Neon gaming accent palette
        neon: {
          cyan: '#00F0FF',
          blue: '#2563EB',
          purple: '#A855F7',
          emerald: '#10B981',
          amber: '#F59E0B',
          red: '#EF4444',
        },

        // Brand colors (Electric Cobalt)
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

        // Gaming accents
        gaming: {
          400: '#e879f9',
          500: '#d946ef',
          600: '#c026d3',
        },
      },
      borderRadius: {
        lg: 'var(--radius, 0.5rem)',
        md: 'calc(var(--radius, 0.5rem) - 2px)',
        sm: 'calc(var(--radius, 0.5rem) - 4px)',
      },
      boxShadow: {
        'glow-cyan': '0 0 20px -2px rgba(0, 240, 255, 0.35)',
        'glow-blue': '0 0 20px -2px rgba(26, 86, 245, 0.4)',
        'glow-purple': '0 0 20px -2px rgba(168, 85, 247, 0.35)',
        'glow-emerald': '0 0 20px -2px rgba(16, 185, 129, 0.35)',
        'glow-red': '0 0 20px -2px rgba(239, 68, 68, 0.35)',
        'technical': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.08), 0 4px 14px -2px rgba(0, 0, 0, 0.65)',
        'technical-glow': 'inset 0 1px 0 0 rgba(0, 240, 255, 0.2), 0 0 15px -3px rgba(0, 240, 255, 0.2)',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['var(--font-jetbrains-mono)', 'ui-monospace', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        'fade-out': 'fadeOut 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-up': 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-down': 'slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-in-right': 'slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-out-right': 'slideOutRight 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        'pulse-glow': 'pulseGlow 2.5s ease-in-out infinite',
        'shimmer': 'shimmer 2s infinite linear',
        'accordion-down': 'accordionDown 0.2s ease-out',
        'accordion-up': 'accordionUp 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        slideOutRight: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(100%)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(0, 240, 255, 0)' },
          '50%': { boxShadow: '0 0 20px 2px rgba(0, 240, 255, 0.35)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        accordionDown: {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        accordionUp: {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
    },
  },
  plugins: [],
};

export default sharedConfig;
