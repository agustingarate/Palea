import { z } from 'zod';
import { primitives } from './primitives';
import { semanticColorReferences } from './semantic';

export { primitives, semanticColorReferences };
export type { ColorPrimitive } from './primitives';
export type { SemanticColorName, SemanticColorReferences } from './semantic';

export type ThemeMode = keyof typeof semanticColorReferences;
export type ResolvedTheme = Record<
  keyof typeof semanticColorReferences.light,
  string
>;

const hexColorSchema = z.string().regex(/^#[0-9a-f]{6}$/i);
const colorPrimitiveSchema = z.enum(
  Object.keys(primitives.color) as [
    keyof typeof primitives.color,
    ...(keyof typeof primitives.color)[],
  ],
);

export const tokenSchema = z.object({
  color: z.record(z.string(), hexColorSchema),
  semantic: z.object({
    light: z.record(z.string(), colorPrimitiveSchema),
    dark: z.record(z.string(), colorPrimitiveSchema),
  }),
});

export function validateTokens(): void {
  tokenSchema.parse({
    color: primitives.color,
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

export function toCssVariables(theme: ResolvedTheme): Record<string, string> {
  return Object.fromEntries(
    Object.entries(theme).map(([name, value]) => [
      `--color-${name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}`,
      value,
    ]),
  );
}

validateTokens();
