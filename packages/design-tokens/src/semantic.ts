import type { ColorPrimitive } from './primitives';

export type SemanticColorName =
  | 'background'
  | 'surface'
  | 'surfaceSubtle'
  | 'text'
  | 'textMuted'
  | 'border'
  | 'primary'
  | 'onPrimary'
  | 'primarySubtle'
  | 'success'
  | 'danger'
  | 'warning';

export type SemanticColorReferences = Record<SemanticColorName, ColorPrimitive>;

export const semanticColorReferences = {
  light: {
    background: 'warmBackground',
    surface: 'white',
    surfaceSubtle: 'gray100',
    text: 'black',
    textMuted: 'gray700',
    border: 'gray300',
    primary: 'ink',
    onPrimary: 'white',
    primarySubtle: 'accentSubtle',
    success: 'success',
    danger: 'danger',
    warning: 'warning',
  },
  dark: {
    background: 'darkBackground',
    surface: 'darkSurface',
    surfaceSubtle: 'gray900',
    text: 'gray100',
    textMuted: 'gray300',
    border: 'darkBorder',
    primary: 'darkAccent',
    onPrimary: 'ink',
    primarySubtle: 'gray700',
    success: 'success',
    danger: 'danger',
    warning: 'warning',
  },
} as const satisfies Record<'light' | 'dark', SemanticColorReferences>;
