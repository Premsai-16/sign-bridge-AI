// Design Tokens for SignBridge AI
// Accessibility-focused design system with Indian heritage aesthetic (Indigo, Saffron, Teal)

export const designTokens = {
  colors: {
    // Primary brand palette - Deep Indigo (Trust, depth, technology)
    primary: {
      50: '#eef2ff',
      100: '#e0e7ff',
      200: '#c7d2fe',
      300: '#a5b4fc',
      400: '#818cf8',
      500: '#6366f1',
      600: '#4f46e5',
      700: '#4338ca',
      800: '#3730a3',
      900: '#312e81',
      950: '#1e1b4b',
    },
    // Saffron Accent - Warmth, Indian sign heritage, energy
    saffron: {
      50: '#fffbeb',
      100: '#fef3c7',
      200: '#fde68a',
      300: '#fcd34d',
      400: '#fbbf24',
      500: '#f59e0b',
      600: '#d97706',
      700: '#b45309',
      800: '#92400e',
      900: '#78350f',
    },
    // Teal Accent - Fluid communication, bridge flow
    teal: {
      50: '#f0fdfa',
      100: '#ccfbf1',
      200: '#99f6e4',
      300: '#5eead4',
      400: '#2dd4bf',
      500: '#14b8a6',
      600: '#0d9488',
      700: '#0f766e',
      800: '#115e59',
      900: '#134e4a',
    },
    // Semantic colors
    success: '#0d9488',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#4f46e5',
  },

  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '0.75rem',
    lg: '1rem',
    xl: '1.5rem',
    '2xl': '2rem',
    '3xl': '2.5rem',
    '4xl': '3rem',
    '5xl': '4rem',
    '6xl': '6rem',
  },

  radius: {
    sm: '0.375rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    '2xl': '1.5rem',
    pill: '9999px',
  },

  fontFamily: {
    display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
    sans: ['Inter', 'system-ui', 'sans-serif'],
  },
} as const

export const lightThemeColors = {
  '--color-background': 'hsl(40 20% 98%)',
  '--color-foreground': 'hsl(240 10% 12%)',
  '--color-primary': 'hsl(243 75% 59%)',
  '--color-primary-foreground': 'hsl(0 0% 100%)',
  '--color-secondary': 'hsl(38 92% 50%)',
  '--color-secondary-foreground': 'hsl(30 100% 10%)',
  '--color-muted': 'hsl(240 10% 94%)',
  '--color-muted-foreground': 'hsl(240 6% 40%)',
  '--color-accent': 'hsl(175 80% 32%)',
  '--color-accent-foreground': 'hsl(0 0% 100%)',
  '--color-border': 'hsl(240 10% 88%)',
  '--color-input': 'hsl(240 10% 88%)',
  '--color-ring': 'hsl(243 75% 59%)',
}

export const darkThemeColors = {
  '--color-background': 'hsl(240 20% 8%)',
  '--color-foreground': 'hsl(40 20% 96%)',
  '--color-primary': 'hsl(243 85% 68%)',
  '--color-primary-foreground': 'hsl(240 20% 8%)',
  '--color-secondary': 'hsl(38 92% 50%)',
  '--color-secondary-foreground': 'hsl(240 20% 8%)',
  '--color-muted': 'hsl(240 15% 15%)',
  '--color-muted-foreground': 'hsl(240 10% 65%)',
  '--color-accent': 'hsl(175 70% 45%)',
  '--color-accent-foreground': 'hsl(240 20% 8%)',
  '--color-border': 'hsl(240 15% 20%)',
  '--color-input': 'hsl(240 15% 20%)',
  '--color-ring': 'hsl(243 85% 68%)',
}