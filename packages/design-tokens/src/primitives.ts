export const primitives = {
  color: {
    black: '#0A0A0A',
    ink: '#070F17',
    white: '#FFFFFF',
    warmBackground: '#FCF8F8',
    gray100: '#F2F2F2',
    gray300: '#D4D4D4',
    gray500: '#8A8A8A',
    gray700: '#4A4A4A',
    gray900: '#1A1A1A',
    accentSubtle: '#E1E7EF',
    darkBackground: '#121212',
    darkSurface: '#1E1E1E',
    darkBorder: '#333333',
    darkAccent: '#A0C9FF',
    success: '#2E7D32',
    danger: '#C62828',
    warning: '#B8860B',
  },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 },
  radius: { sm: 6, md: 12, lg: 20, full: 9999 },
  typography: {
    headlineLg: {
      fontFamily: 'Inter',
      fontSize: 28,
      fontWeight: '700',
      lineHeight: 34,
    },
    headlineLgMobile: {
      fontFamily: 'Inter',
      fontSize: 24,
      fontWeight: '700',
      lineHeight: 30,
    },
    headlineMd: {
      fontFamily: 'Inter',
      fontSize: 20,
      fontWeight: '600',
      lineHeight: 28,
    },
    bodyMd: {
      fontFamily: 'Inter',
      fontSize: 16,
      fontWeight: '400',
      lineHeight: 24,
    },
    bodySm: {
      fontFamily: 'Inter',
      fontSize: 14,
      fontWeight: '400',
      lineHeight: 20,
    },
    labelSm: {
      fontFamily: 'Inter',
      fontSize: 12,
      fontWeight: '500',
      lineHeight: 16,
    },
  },
  shadow: {
    subtle: {
      color: '#000000',
      opacity: 0.06,
      radius: 3,
      offsetY: 1,
      elevation: 1,
    },
    elevated: {
      color: '#000000',
      opacity: 0.1,
      radius: 16,
      offsetY: 4,
      elevation: 4,
    },
  },
} as const;

export type ColorPrimitive = keyof typeof primitives.color;
