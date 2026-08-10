import { z } from 'zod';
import { primitives } from './primitives';
import { semanticColorReferences, type SemanticColorName } from './semantic';

export { primitives, semanticColorReferences };
export type { ColorPrimitive } from './primitives';
export type { SemanticColorName, SemanticColorReferences } from './semantic';

export type ThemeMode = keyof typeof semanticColorReferences;
export type ResolvedTheme = Record<SemanticColorName, string>;

const hexColorSchema = z.string().regex(/^#[0-9a-f]{6}$/i);
const colorPrimitiveSchema = z.enum(
  Object.keys(primitives.color) as [
    keyof typeof primitives.color,
    ...(keyof typeof primitives.color)[],
  ],
);

export const tokenSchema = z.object({
  color: z.record(z.string(), hexColorSchema),
  spacing: z.record(z.string(), z.number().nonnegative()),
  radius: z.record(z.string(), z.number().nonnegative()),
  size: z.record(z.string(), z.number().positive()),
  opacity: z.record(z.string(), z.number().min(0).max(1)),
  semantic: z.object({
    light: z.record(z.string(), colorPrimitiveSchema),
    dark: z.record(z.string(), colorPrimitiveSchema),
  }),
});

export function validateTokens(): void {
  tokenSchema.parse({
    color: primitives.color,
    spacing: primitives.spacing,
    radius: primitives.radius,
    size: primitives.size,
    opacity: primitives.opacity,
    semantic: semanticColorReferences,
  });
  const lightKeys = Object.keys(semanticColorReferences.light).sort().join(',');
  const darkKeys = Object.keys(semanticColorReferences.dark).sort().join(',');
  if (lightKeys !== darkKeys) throw new Error('Semantic theme keys must match');
}

export function resolveTheme(mode: ThemeMode): ResolvedTheme {
  const references = semanticColorReferences[mode];
  return Object.fromEntries(
    Object.entries(references).map(([name, reference]) => [
      name,
      primitives.color[reference],
    ]),
  ) as ResolvedTheme;
}

export const themes = {
  light: resolveTheme('light'),
  dark: resolveTheme('dark'),
} as const;

function kebabCase(value: string): string {
  return value.replace(/[A-Z]/g, (character) => `-${character.toLowerCase()}`);
}

export function toCssVariables(theme: ResolvedTheme): Record<string, string> {
  return Object.fromEntries(
    Object.entries(theme).map(([name, value]) => [
      `--color-${kebabCase(name)}`,
      value,
    ]),
  );
}

export function toNativeWindTheme(theme: ResolvedTheme) {
  return {
    colors: Object.fromEntries(
      Object.entries(theme).map(([name, value]) => [kebabCase(name), value]),
    ),
    spacing: primitives.spacing,
    borderRadius: primitives.radius,
    fontFamily: {
      sans: ['Inter_400Regular'],
      medium: ['Inter_500Medium'],
      semibold: ['Inter_600SemiBold'],
      bold: ['Inter_700Bold'],
    },
    fontSize: Object.fromEntries(
      Object.entries(primitives.typography).map(([name, value]) => [
        kebabCase(name),
        [
          value.fontSize,
          {
            // Tailwind interprets numeric line heights as a multiplier. NativeWind
            // accepts CSS lengths on web and resolves them back to dp natively,
            // keeping the typography token in pixel units on every platform.
            lineHeight: `${value.lineHeight}px`,
            letterSpacing:
              'letterSpacing' in value ? value.letterSpacing : undefined,
          },
        ],
      ]),
    ),
    boxShadow: {
      subtle: primitives.shadow.subtle.css,
      elevated: primitives.shadow.elevated.css,
    },
  } as const;
}

validateTokens();
