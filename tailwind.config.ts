/**
 * @file tailwind.config.ts
 * @description Tailwind CSS configuration for OpenLearn.
 * Implements the TasteSkill editorial design system with bespoke color tokens
 * (page paper, charcoal, electric orange), tactile shadows, typography scales,
 * and container constraints.
 */

import type { Config } from 'tailwindcss';
import animate from 'tailwindcss-animate';

const config: Config = {
  darkMode: ['class'],
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    container: {
      center: true,
      padding: '1.5rem',
      screens: {
        '2xl': '1240px',
      },
    },
    extend: {
      colors: {
        page: {
          DEFAULT: '#F5F4F0',
          subtle: '#EFECE6',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          muted: '#F8F7F4',
        },
        charcoal: {
          DEFAULT: '#0A0A0A',
          subtle: '#141414',
          hover: '#222222',
        },
        accent: {
          DEFAULT: '#FF5226',
          hover: '#E04018',
          active: '#C4320F',
          subtle: 'rgba(255, 82, 38, 0.08)',
          border: 'rgba(255, 82, 38, 0.28)',
          glow: 'rgba(255, 82, 38, 0.22)',
        },
        editorial: {
          primary: '#0A0A0A',
          secondary: '#4A4744',
          muted: '#787571',
          subtle: '#A3A09B',
        },
        status: {
          emerald: '#059669',
          'emerald-subtle': 'rgba(5, 150, 105, 0.09)',
          amber: '#D97706',
          'amber-subtle': 'rgba(217, 119, 6, 0.10)',
          rose: '#DC2626',
          'rose-subtle': 'rgba(220, 38, 38, 0.08)',
        },
        border: {
          subtle: 'rgba(0, 0, 0, 0.06)',
          card: 'rgba(0, 0, 0, 0.08)',
          hover: 'rgba(0, 0, 0, 0.14)',
          dark: 'rgba(0, 0, 0, 0.85)',
        },
      },
      fontFamily: {
        sans: ['var(--font-outfit)', 'sans-serif'],
        heading: ['var(--font-outfit)', 'sans-serif'],
        serif: ['var(--font-newsreader)', 'Georgia', 'serif'],
        mono: ['var(--font-jetbrains-mono)', 'monospace'],
      },
      borderRadius: {
        xs: '4px',
        sm: '8px',
        md: '12px',
        lg: '18px',
        xl: '24px',
        full: '9999px',
      },
      boxShadow: {
        'taste-sm': '0 2px 6px rgba(15, 15, 15, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02)',
        'taste-md': '0 10px 24px -6px rgba(15, 15, 15, 0.06), 0 4px 10px -2px rgba(0, 0, 0, 0.02)',
        'taste-lg': '0 22px 44px -22px rgba(15, 15, 15, 0.12), 0 8px 18px -6px rgba(0, 0, 0, 0.03)',
        'taste-dark-btn': '0 10px 24px -6px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.18)',
        'taste-orange': '0 8px 24px -6px rgba(255, 82, 38, 0.32)',
      },
      animation: {
        sensorBlink: 'sensorBlink 2.2s infinite ease-in-out',
        soundChipPulse: 'soundChipPulse 1.2s infinite ease-in-out',
        badgePop: 'badgePop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
      },
      keyframes: {
        sensorBlink: {
          '0%, 100%': { opacity: '0.35', transform: 'scale(0.95)' },
          '50%': { opacity: '1', transform: 'scale(1.15)' },
        },
        soundChipPulse: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.28)', color: '#E04018' },
        },
        badgePop: {
          '0%': { transform: 'scale(0.3)', opacity: '0' },
          '70%': { transform: 'scale(1.15)', opacity: '1' },
          '100%': { transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [animate],
};

export default config;
