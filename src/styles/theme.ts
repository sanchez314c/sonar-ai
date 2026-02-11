// Neo-Noir Glass Monitor design tokens
export const theme = {
  colors: {
    // Background colors
    void: '#0a0b0e',
    surface: '#111214',
    card: '#141518',
    cardHover: '#1a1b1f',
    sidebar: '#0d0e10',
    tertiary: '#18191c',
    input: '#18191c',
    modal: 'rgba(10, 11, 14, 0.94)',
    tooltip: '#222328',

    // Accent colors
    teal: '#14b8a6',
    tealDim: 'rgba(20, 184, 166, 0.12)',
    tealGlow: 'rgba(20, 184, 166, 0.25)',
    tealHover: '#0d9488',
    blue: '#06b6d4',
    blueDim: 'rgba(6, 182, 212, 0.15)',
    purple: '#8b5cf6',
    purpleDim: 'rgba(139, 92, 246, 0.15)',

    // Text colors
    textPrimary: '#e8e8ec',
    textSecondary: '#9a9aa6',
    textMuted: '#5c5c6a',
    textDim: '#44444e',
    textHeading: '#f4f4f7',
    textAccent: '#14b8a6',
    textInverse: '#0a0b0e',

    // Status colors
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#38bdf8',
    statusOffline: '#52525b',
    statusOnline: '#10b981',
    statusBusy: '#ef4444',
    statusAway: '#f59e0b',

    // Border colors
    borderSubtle: '#1e1e24',
    borderLight: '#2a2a30',
    borderGlow: 'rgba(20, 184, 166, 0.25)',
    borderInput: '#2a2a30',
    borderFocus: '#14b8a6',

    // Glass effects
    glassBg: 'rgba(255, 255, 255, 0.03)',
    glassBgMedium: 'rgba(255, 255, 255, 0.05)',
    glassBorder: 'rgba(255, 255, 255, 0.05)',
    glassHighlight: 'rgba(255, 255, 255, 0.06)',
    glassHighlightStrong: 'rgba(255, 255, 255, 0.10)',
  },

  gradients: {
    primary: 'linear-gradient(135deg, #14b8a6, #06b6d4)',
    accent: 'linear-gradient(135deg, #14b8a6, #8b5cf6)',
    card: 'linear-gradient(145deg, #141518, #18191c)',
    sidebar: 'linear-gradient(180deg, #0d0e10, #0a0b0e)',
    bg: 'linear-gradient(160deg, #0a0b0e, #0f1012)',
    button: 'linear-gradient(135deg, #14b8a6, #0d9488)',
    header: 'linear-gradient(90deg, #14b8a6, #06b6d4)',
  },

  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },

  borderRadius: {
    xs: '4px',
    sm: '6px',
    md: '10px',
    card: '14px',
    button: '10px',
    input: '10px',
    lg: '14px',
    xl: '20px',
    xxl: '28px',
    full: '9999px',
  },

  fontSize: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '2rem',
  },

  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },

  shadows: {
    sm: '0 1px 2px rgba(0,0,0,0.2), 0 2px 4px rgba(0,0,0,0.15)',
    md: '0 2px 4px rgba(0,0,0,0.2), 0 4px 8px rgba(0,0,0,0.2), 0 8px 16px rgba(0,0,0,0.15)',
    lg: '0 4px 8px rgba(0,0,0,0.2), 0 8px 16px rgba(0,0,0,0.2), 0 16px 32px rgba(0,0,0,0.2)',
    xl: '0 4px 8px rgba(0,0,0,0.15), 0 8px 16px rgba(0,0,0,0.15), 0 16px 32px rgba(0,0,0,0.2), 0 32px 64px rgba(0,0,0,0.25)',
    card: '0 2px 4px rgba(0,0,0,0.15), 0 4px 12px rgba(0,0,0,0.2), 0 8px 24px rgba(0,0,0,0.15)',
    cardHover: '0 4px 8px rgba(0,0,0,0.2), 0 8px 24px rgba(0,0,0,0.25), 0 16px 44px rgba(0,0,0,0.2)',
    glow: '0 0 16px rgba(20,184,166,0.15)',
    glowStrong: '0 0 24px rgba(20,184,166,0.25)',
    glowAccent: '0 0 16px rgba(6,182,212,0.15)',
    inset: 'inset 0 1px 3px rgba(0,0,0,0.4)',
  },

  transitions: {
    fast: '150ms ease',
    normal: '250ms ease',
    slow: '400ms ease',
  },

  zIndex: {
    base: 0,
    dragHandle: 50,
    dropdown: 100,
    sticky: 200,
    windowControls: 200,
    modal: 300,
    popover: 400,
    tooltip: 500,
    toast: 600,
  },
} as const

export type Theme = typeof theme
