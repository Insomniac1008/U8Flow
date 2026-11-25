const { fontFamily } = require('tailwindcss/defaultTheme');

/** @type {import('tailwindcss').Config} */

module.exports = {
  darkMode: ['selector'],
  content: [
    './src/pages/**/*.tsx',
    './src/components/**/*.tsx',
    './src/layouts/**/*.tsx',
    './src/ee-stub/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1536px',
      },
    },
    screens: {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
      '3xl': '1780px',
      '4xl': '1980px',
    },
    extend: {
      borderWidth: {
        0.5: '0.5px',
      },
      colors: {
        border: 'var(--border-default)',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'var(--background)',
        foreground: 'var(--colors-text-neutral-strong)',
        buttonBlueText: 'var(--button-blue-text)',

        'colors-outline-sentiment-primary':
          'var(--colors-outline-sentiment-primary)',
        'colors-outline-neutral-strong': 'var(--colors-outline-neutral-strong)',
        'colors-outline-neutral-standard':
          'var(--colors-outline-neutral-standard)',

        'colors-text-neutral-strong': 'var(--colors-text-neutral-strong)',
        'colors-text-neutral-standard': 'var(--colors-text-neutral-standard)',

        'text-badge': 'var(--text-badge)',
        'text-title': 'var(--text-title)',
        'text-sub-title': 'var(--text-sub-title)',
        'text-sub-title-invert': 'var(--text-sub-title-invert)',
        'text-title-invert': 'var(--text-title-invert)',
        'background-header-bar': 'var(--background-header-bar)',
        'background-card': 'var(--background-card)',
        'background-highlight': 'var(--background-highlight)',

        'input-border': 'var(--input-border)',

        /* design colors */
        'bg-title': 'var(--bg-title)',
        'bg-base': 'var(--bg-base)',
        'bg-card': 'var(--bg-card)',
        'bg-component': 'var(--bg-component)',
        'bg-input': 'var(--bg-input)',
        'bg-canvas': {
          DEFAULT: 'rgb(var(--bg-canvas) / <alpha-value>)',
        },
        'bg-list': {
          DEFAULT: 'rgb(var(--bg-list) / <alpha-value>)',
        },
        'text-primary': {
          DEFAULT: 'rgb(var(--text-primary) / <alpha-value>)',
        },
        'text-primary-inverse': {
          DEFAULT: 'rgb(var(--text-primary-inverse) / <alpha-value>)',
        },
        'text-secondary': {
          DEFAULT: 'rgb(var(--text-secondary) / <alpha-value>)',
        },
        'text-secondary-inverse': {
          DEFAULT: 'rgb(var(--text-secondary-inverse) / <alpha-value>)',
        },
        'text-disabled': 'var(--text-disabled)',
        'border-default': 'var(--border-default)',
        'border-accent': 'var(--border-accent)',
        'border-button': 'var(--border-button)',
        'accent-primary': {
          DEFAULT: 'rgb(var(--accent-primary) / <alpha-value>)',
          5: 'rgba(var(--accent-primary) / 0.05)', // 5%
        },
        'bg-accent': 'var(--bg-accent)',
        'state-success': {
          DEFAULT: 'rgb(var(--state-success) / <alpha-value>)',
          5: 'rgba(var(--state-success) / 0.05)', // 5%
        },
        'state-warning': {
          DEFAULT: 'rgb(var(--state-warning) / <alpha-value>)',
          5: 'rgba(var(--state-warning) / 0.05)', // 5%
        },
        'state-error': {
          DEFAULT: 'rgb(var(--state-error) / <alpha-value>)',
          5: 'rgba(var(--state-error) / 0.05)', // 5%
        },
        'team-group': 'var(--team-group)',
        'team-member': 'var(--team-member)',
        'team-department': 'var(--team-department)',
        'bg-member': 'var(--bg-member)',

        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'var(--background-inverse-strong)',
          foreground: 'var(--background-inverse-strong-foreground)',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
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
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'var(--background-inverse-standard)',
          foreground: 'var(--background-inverse-standard-foreground)',
        },
        backgroundCoreWeak: 'var(--background-core-weak)',
        'colors-background-neutral-standard': {
          DEFAULT: 'var(--colors-background-neutral-standard)',
          foreground: 'var(--background-inverse-standard-foreground)',
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))',
        },
      },
      backgroundImage: {
        'metallic-gradient':
          'linear-gradient(135deg, rgb(var(--accent-primary)) 0%, var(--metallic) 52%, rgb(var(--accent-primary)) 100%)',
        'apple-iridescent':
          'linear-gradient(120deg, #007aff 0%, #5856d6 50%, #32ade6 100%)',
        'apple-iridescent-dark':
          'linear-gradient(120deg, #409cff 0%, #7d7aff 50%, #64d2ff 100%)',
      },
      boxShadow: {
        'apple-sm':
          '0 2px 8px -2px rgba(15, 23, 42, 0.08), 0 0 0 0.5px var(--glass-stroke)',
        'apple-md': 'var(--glass-shadow)',
        'apple-lg': 'var(--glass-shadow-lg)',
        'apple-thumb': 'var(--glass-shadow-thumb)',
      },
      transitionTimingFunction: {
        'apple-spring': 'cubic-bezier(0.22, 1, 0.36, 1)',
        'apple-bounce': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'apple-sheet': 'cubic-bezier(0.32, 0.72, 0, 1)',
        'apple-press': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      },
      borderRadius: {
        px: '1px',

        '4xl': '1.25rem' /* 20px */,
        '3xl': '1rem' /* 16px */,
        '2xl': '0.875rem' /* 14px */,
        xl: '0.75rem' /* 12px */,
        lg: '0.625rem' /* 10px */,
        DEFAULT: '0.5rem' /* 8px */,
        sm: '0.375rem' /* 6px */,
        xs: '0.3125rem' /* 5px */,
        '2xs': '0.25rem' /* 4px */,
        '3xs': '0.125rem' /* 2px */,
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'SF Pro Text',
          'SF Pro Display',
          'PingFang SC',
          'Hiragino Sans GB',
          'var(--font-sans)',
          ...fontFamily.sans,
        ],
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0', opacity: '0' },
          to: {
            height: 'var(--radix-accordion-content-height)',
            opacity: '1',
          },
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)',
            opacity: '1',
          },
          to: { height: '0', opacity: '0' },
        },
        'caret-blink': {
          '0%,70%,100%': { opacity: '1' },
          '20%,50%': { opacity: '0' },
        },
        'spin-reverse': {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(-360deg)' },
        },
        'bell-shake': {
          '0%,25%': { transform: 'rotate(0)', transformOrigin: 'center 25% ' },
          '3.125%': { transform: 'rotate(-12.5deg)' },
          '9.375%': { transform: 'rotate(11deg)' },
          '15.625%': { transform: 'rotate(-9.5deg)' },
          '21.875%': { transform: 'rotate(7.5deg)' },
        },
        'apple-shimmer': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        'apple-pop': {
          '0%': { transform: 'scale(0.84)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      animation: {
        'accordion-down':
          'accordion-down 0.28s cubic-bezier(0.22, 1, 0.36, 1)',
        'accordion-up': 'accordion-up 0.22s cubic-bezier(0.22, 1, 0.36, 1)',
        'caret-blink': 'caret-blink 1.25s ease-out infinite',
        'spin-reverse': 'spin-reverse 1s linear infinite',
        'bell-shake':
          'bell-shake 2s 1s cubic-bezier(0.33, 1, 0.68, 1) infinite',
        'apple-shimmer':
          'apple-shimmer 1.8s cubic-bezier(0.22, 1, 0.36, 1) infinite',
        'apple-pop': 'apple-pop 0.22s cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
    require('@tailwindcss/line-clamp'),
    require('tailwind-scrollbar'),
    require('@tailwindcss/container-queries'),
    require('@tailwindcss/typography'),
  ],
};
